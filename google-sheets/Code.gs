/* Google Sheets receiver for the eZ2 survey. Deploy only after following README.md.
 * Requires Schema.gs (SURVEY_SCHEMA) and Logic.gs (shared pure survey functions).
 * This file never publishes the response sheet or returns stored answers.
 */
const BACKEND_SETTINGS = Object.freeze({
  sheetName: 'Responses',
  maxPostBytes: 131072,
  maxPayloadCharacters: 32768,
  maxAnswerCharacters: 4096,
  maxAnswerKeys: 160,
  lockWaitMs: 15000
});

function doGet() {
  return receiptPage_('Survey submission endpoint',
    'Open the survey link to complete the questionnaire. This address accepts survey submissions only.', null, safeReturnUrl_());
}

function doPost(e) {
  try {
    const config = backendConfig_();
    const packet = readPacket_(e);
    const record = canonicalRecord_(packet);
    const receipt = saveRecord_(config, record);
    return receiptPage_('Your response has been saved',
      receipt.duplicate ? 'This response was already received. No duplicate row was added.' : 'Thank you for taking part in the survey.',
      receipt, config.returnUrl);
  } catch (error) {
    // Deliberately do not log the request, answers, spreadsheet ID, or return URL.
    console.warn('Survey submission failed: ' + (error.publicMessage ? 'validation' : 'storage/configuration'));
    return receiptPage_('Your response could not be saved',
      error.publicMessage || 'The survey could not save your response. Please return to the survey and try again later, or contact the survey organizer.',
      null, safeReturnUrl_());
  }
}

/** Run once, manually, from the Apps Script editor before deploying. */
function setupSurveySheet() {
  const config = backendConfig_();
  const lock = LockService.getScriptLock();
  lock.waitLock(BACKEND_SETTINGS.lockWaitMs);
  try {
    const book = SpreadsheetApp.openById(config.spreadsheetId);
    const sheet = book.getSheetByName(BACKEND_SETTINGS.sheetName) || book.insertSheet(BACKEND_SETTINGS.sheetName);
    const headers = backendHeaders_();
    if (sheet.getLastRow() === 0) {
      writeLiteralRow_(sheet, 1, headers);
      sheet.setFrozenRows(1);
    } else {
      checkHeaders_(sheet, headers);
    }
    SpreadsheetApp.flush();
    console.log('Responses sheet initialized. Columns: ' + headers.length + '. Survey version: ' + SURVEY_SCHEMA.version);
  } finally {
    lock.releaseLock();
  }
}

function backendConfig_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = String(props.getProperty('SPREADSHEET_ID') || '').trim();
  const returnUrl = String(props.getProperty('RETURN_URL') || '').trim();
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(spreadsheetId)) throw new Error('Missing/invalid SPREADSHEET_ID');
  if (!validReturnUrl_(returnUrl)) throw new Error('Missing/invalid RETURN_URL');
  return { spreadsheetId: spreadsheetId, returnUrl: returnUrl };
}

function validReturnUrl_(value) {
  // Only an owner-configured HTTPS URL is used. Never take a URL from the packet.
  return typeof value === 'string' && value.length <= 2048 &&
    /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?(?:[/?#][^\s<>"'\\]*)?$/.test(value);
}

function safeReturnUrl_() {
  try {
    const value = String(PropertiesService.getScriptProperties().getProperty('RETURN_URL') || '').trim();
    return validReturnUrl_(value) ? value : '';
  } catch (_) { return ''; }
}

function readPacket_(e) {
  if (!e || !e.parameter || !e.parameters) publicError_('No survey payload was received. Please submit from the questionnaire.');
  const byteCount = Number(e.contentLength || (e.postData && e.postData.length) || 0);
  if (!Number.isFinite(byteCount) || byteCount <= 0 || byteCount > BACKEND_SETTINGS.maxPostBytes) publicError_('The submitted response is too large or empty.');
  const names = Object.keys(e.parameters);
  if (names.length !== 1 || names[0] !== 'payload' || !Array.isArray(e.parameters.payload) || e.parameters.payload.length !== 1) publicError_('The submission format is invalid. Please reopen the survey.');
  const raw = e.parameter.payload;
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > BACKEND_SETTINGS.maxPayloadCharacters) publicError_('The submitted response is too large or empty.');
  let packet;
  try { packet = JSON.parse(raw); } catch (_) { publicError_('The submitted response could not be read. Please reopen the survey.'); }
  if (!plainObject_(packet)) publicError_('The submission format is invalid.');
  const allowed = ['schemaVersion', 'surveyTitle', 'responseId', 'startedAt', 'completedAt', 'planOrder', 'answers', 'asked', 'flat'];
  if (Object.keys(packet).some(function (key) { return allowed.indexOf(key) < 0; })) publicError_('The submission contains unsupported fields.');
  return packet;
}

function canonicalRecord_(packet) {
  if (packet.schemaVersion !== SURVEY_SCHEMA.version) publicError_('This survey version is no longer accepted. Please reopen the current survey link.');
  if (typeof packet.responseId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packet.responseId)) publicError_('The response identifier is invalid. Please reopen the survey.');
  if (!plainObject_(packet.answers) || Object.keys(packet.answers).length > BACKEND_SETTINGS.maxAnswerKeys) publicError_('The answers are not in the expected format.');
  const allowedKeys = answerKeySet_();
  Object.keys(packet.answers).forEach(function (key) {
    if (!allowedKeys.has(key)) publicError_('The response contains an unknown question field.');
    const value = packet.answers[key];
    if (Array.isArray(value)) {
      if (value.length > 20 || value.some(function (item) { return !answerScalar_(item); })) publicError_('A multiple-choice answer has an invalid format.');
    } else if (!answerScalar_(value) && value !== null) {
      publicError_('An answer has an invalid format.');
    }
  });
  const planOrder = packet.planOrder;
  if (!Array.isArray(planOrder) || planOrder.length !== 3 || planOrder.map(String).sort().join(',') !== '1,2,3') publicError_('The pricing display order is invalid. Please reopen the survey.');
  const startedAt = validTimestamp_(packet.startedAt);
  const completedAt = validTimestamp_(packet.completedAt);
  if (!startedAt || !completedAt || Date.parse(completedAt) < Date.parse(startedAt)) publicError_('The response timestamps are invalid. Please reopen the survey.');
  // The browser's derived flat/asked/surveyTitle values are intentionally ignored.
  const cleaned = cleanAnswers(SURVEY_SCHEMA, packet.answers);
  if (String(cleaned.Q1) !== '1') publicError_('This questionnaire is for currently enrolled students at large public universities in the U.S. No response was saved.');
  const errors = validateAll(SURVEY_SCHEMA, cleaned);
  if (errors.length) publicError_('Please review the questionnaire: ' + errors.slice(0, 4).map(function (item) { return item.key + ': ' + item.message; }).join(' '));
  return makeRecord(SURVEY_SCHEMA, cleaned, {
    responseId: packet.responseId,
    startedAt: startedAt,
    completedAt: completedAt,
    planOrder: planOrder.map(String)
  });
}

function answerKeySet_() {
  const keys = new Set();
  SURVEY_SCHEMA.sections.forEach(function (section) {
    section.questions.forEach(function (question) {
      const products = question.products || [null];
      products.forEach(function (product) {
        const key = question.id + (product ? '_' + product : '');
        keys.add(key);
        (question.options || []).forEach(function (option) {
          if (option.other) keys.add(key + '__' + option.value + '_text');
        });
      });
    });
  });
  return keys;
}

function answerScalar_(value) {
  return (typeof value === 'string' && value.length <= BACKEND_SETTINGS.maxAnswerCharacters) ||
    (typeof value === 'number' && Number.isFinite(value));
}

function validTimestamp_(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

function plainObject_(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.prototype.toString.call(value) === '[object Object]';
}

function emptyFlat_() {
  const fields = {};
  SURVEY_SCHEMA.sections.forEach(function (section) {
    section.questions.forEach(function (question) {
      question.exportFields.forEach(function (field) {
        if (Object.prototype.hasOwnProperty.call(fields, field)) throw new Error('Duplicate schema export field');
        fields[field] = '';
        fields[field + '__asked'] = '';
      });
    });
  });
  return fields;
}

function backendHeaders_() {
  return ['submission_id', 'received_at_utc', 'survey_version', 'started_at_utc', 'completed_at_utc', 'plan_order', 'payload_sha256'].concat(Object.keys(emptyFlat_()));
}

function checkHeaders_(sheet, headers) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() !== headers.length) throw new Error('Responses schema mismatch');
  const existing = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (JSON.stringify(existing) !== JSON.stringify(headers)) throw new Error('Responses headers mismatch');
}

function saveRecord_(config, record) {
  const lock = LockService.getScriptLock();
  lock.waitLock(BACKEND_SETTINGS.lockWaitMs);
  try {
    const sheet = SpreadsheetApp.openById(config.spreadsheetId).getSheetByName(BACKEND_SETTINGS.sheetName);
    if (!sheet) throw new Error('Run setupSurveySheet before deploying');
    const headers = backendHeaders_();
    checkHeaders_(sheet, headers);
    const digest = digest_(JSON.stringify({ version: record.schemaVersion, answers: record.answers, planOrder: record.planOrder }));
    if (sheet.getLastRow() > 1) {
      const match = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(record.responseId).matchEntireCell(true).findNext();
      if (match) {
        const existing = sheet.getRange(match.getRow(), 1, 1, 7).getDisplayValues()[0];
        if (existing[6] !== digest) publicError_('This response identifier has already been used with different answers. Your earlier response has not been changed.');
        return { submissionId: record.responseId, receivedAt: existing[1], duplicate: true };
      }
    }
    const receivedAt = new Date().toISOString();
    const values = [record.responseId, receivedAt, record.schemaVersion, record.startedAt, record.completedAt, record.planOrder.join('|'), digest]
      .concat(Object.keys(emptyFlat_()).map(function (key) { return record.flat[key] == null ? '' : record.flat[key]; }));
    writeLiteralRow_(sheet, sheet.getLastRow() + 1, values);
    SpreadsheetApp.flush();
    return { submissionId: record.responseId, receivedAt: receivedAt, duplicate: false };
  } finally {
    lock.releaseLock();
  }
}

function writeLiteralRow_(sheet, row, values) {
  // RichTextValue prevents Sheets formulas; a leading apostrophe also protects CSV exports.
  const rich = values.map(function (value) {
    let text = String(value == null ? '' : value);
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return SpreadsheetApp.newRichTextValue().setText(text).build();
  });
  sheet.getRange(row, 1, 1, values.length).setRichTextValues([rich]);
}

function digest_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
}

function publicError_(message) {
  const error = new Error(message);
  error.publicMessage = message;
  throw error;
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function receiptPage_(title, message, receipt, returnUrl) {
  const details = receipt ? '<p>Receipt: <code>' + escapeHtml_(receipt.submissionId) + '</code><br>Received (UTC): ' + escapeHtml_(receipt.receivedAt) + '</p>' : '';
  const link = returnUrl ? '<p><a href="' + escapeHtml_(returnUrl) + '" target="_top">Return to the survey</a></p>' : '';
  const html = '<!doctype html><html lang="en"><head><base target="_top"><style>body{font:18px/1.6 system-ui,sans-serif;background:#f4f7f5;color:#16382d;margin:0;padding:24px}main{max-width:680px;margin:10vh auto;background:white;border-radius:16px;padding:32px}h1{line-height:1.2}code{overflow-wrap:anywhere}a{color:#176b4e}</style></head><body><main><h1>' + escapeHtml_(title) + '</h1><p>' + escapeHtml_(message) + '</p>' + details + link + '</main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(title).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
