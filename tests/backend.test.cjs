/*
 * Offline Apps Script receiver tests. No network APIs, credentials, or live
 * spreadsheet are used. Run from the site directory:
 *   node --test tests/backend.test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const test = require('node:test');

const siteRoot = path.resolve(__dirname, '..');
const source = ['Schema.gs', 'Logic.gs', 'Code.gs']
  .map(name => fs.readFileSync(path.join(siteRoot, 'google-sheets', name), 'utf8')).join('\n');
const copy = value => JSON.parse(JSON.stringify(value));
const NEW_SHEET = 'Responses_v2_1';
const successText = /Your response has been saved/;

function harness({ initialize = true } = {}) {
  const state = { failWrite: false, failFlush: false, failLock: false, locked: false, writes: [], expansions: [] };
  class Range {
    constructor(sheet, row, column, rows = 1, columns = 1) {
      Object.assign(this, { sheet, row, column, rows, columns });
      if (row < 1 || column < 1 || rows < 1 || columns < 1 || column + columns - 1 > sheet.maxColumns) {
        throw new Error('Requested range exceeds the sheet grid');
      }
    }
    getRow() { return this.row; }
    getDisplayValues() {
      return Array.from({ length: this.rows }, (_, r) =>
        Array.from({ length: this.columns }, (_, c) => this.sheet.data[this.row + r - 1]?.[this.column + c - 1] ?? ''));
    }
    setRichTextValues(values) {
      if (state.failWrite) throw new Error('Simulated Sheets write failure');
      assert.equal(values.length, this.rows);
      for (let r = 0; r < this.rows; r++) {
        assert.equal(values[r].length, this.columns);
        this.sheet.data[this.row + r - 1] ||= [];
        for (let c = 0; c < this.columns; c++) {
          this.sheet.data[this.row + r - 1][this.column + c - 1] = values[r][c].text;
        }
      }
      state.writes.push({ sheet: this.sheet.name, row: this.row, columns: this.columns });
      return this;
    }
    createTextFinder(text) {
      const range = this;
      return {
        matchEntireCell(entire) { assert.equal(entire, true); return this; },
        findNext() {
          const match = range.getDisplayValues().findIndex(row => row[0] === text);
          return match < 0 ? null : new Range(range.sheet, range.row + match, range.column);
        }
      };
    }
  }
  class Sheet {
    constructor(name, columns = 26, data = []) { this.name = name; this.maxColumns = columns; this.data = data; }
    getLastRow() { return this.data.length; }
    getLastColumn() { return Math.max(0, ...this.data.map(row => row.length)); }
    getMaxColumns() { return this.maxColumns; }
    insertColumnsAfter(after, count) {
      assert.equal(after, this.maxColumns);
      assert.ok(Number.isInteger(count) && count > 0);
      this.maxColumns += count;
      state.expansions.push({ sheet: this.name, after, count });
      return this;
    }
    getRange(...args) { return new Range(this, ...args); }
    setFrozenRows(count) { this.frozenRows = count; return this; }
  }
  const legacyData = [['legacy_header', 'legacy_unit_minutes'], ['DO NOT CHANGE', '120']];
  const sheets = { Responses: new Sheet('Responses', 203, copy(legacyData)) };
  const properties = {
    SPREADSHEET_ID: 'offline_test_spreadsheet_1234567890',
    RETURN_URL: 'https://example.github.io/offline-survey/'
  };
  const context = vm.createContext({
    console: { log() {}, warn() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: name => properties[name] }) },
    LockService: { getScriptLock: () => ({
      waitLock() {
        if (state.failLock) throw new Error('Simulated lock timeout');
        assert.equal(state.locked, false);
        state.locked = true;
      },
      releaseLock() { assert.equal(state.locked, true); state.locked = false; }
    }) },
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, properties.SPREADSHEET_ID);
        return {
          getSheetByName: name => sheets[name] || null,
          insertSheet: name => {
            assert.equal(sheets[name], undefined);
            return (sheets[name] = new Sheet(name));
          }
        };
      },
      flush() { if (state.failFlush) throw new Error('Simulated flush failure'); },
      newRichTextValue: () => ({
        setText(text) { this.text = text; return this; },
        build() { return { text: this.text }; }
      })
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (algorithm, text, encoding) => [...crypto.createHash(algorithm).update(text, encoding).digest()]
    },
    HtmlService: { createHtmlOutput: html => ({ html, setTitle() { return this; }, addMetaTag() { return this; } }) }
  });
  vm.runInContext(source, context, { filename: 'offline-apps-script.gs' });
  const schema = JSON.parse(vm.runInContext('JSON.stringify(SURVEY_SCHEMA)', context));
  const baseline = JSON.parse(vm.runInContext(`JSON.stringify((() => {
    const answers={Q1:1,Q4:2,Q6:3,Q11:4,Q12:2,Q15_S:0,Q15_B:10,Q16_S:3,Q16_B:1,Q22:2,Q27_S:1,Q24_S:0.5};
    for (let pass=0;pass<3;pass++) for (const {q,key} of expandedQuestions(SURVEY_SCHEMA,answers)) {
      if (answers[key] !== undefined) continue;
      const type=q.type.replace('product_','');
      answers[key]=type==='text' ? (key==='Q33'?'=1+1':'SYNTHETIC OFFLINE TEST') :
        type==='multi' ? [q.options[0].value] : type==='number' ? 0 : q.options[0].value;
    }
    return answers;
  })())`, context));
  let nextId = 0;
  function packet(overrides = {}) {
    nextId++;
    return {
      schemaVersion: '2.1',
      responseId: '11111111-1111-4111-8111-' + String(nextId).padStart(12, '0'),
      startedAt: '2026-10-20T12:00:00.000Z',
      completedAt: '2026-10-20T12:05:00.000Z',
      planOrder: [3, 1, 2],
      answers: { ...copy(baseline), ...overrides }
    };
  }
  function event(input) {
    const payload = typeof input === 'string' ? input : JSON.stringify(input);
    return { contentLength: Buffer.byteLength(new URLSearchParams({ payload }).toString()), parameter: { payload }, parameters: { payload: [payload] } };
  }
  function submit(input) { return context.doPost(event(input)).html; }
  function rows() { return sheets[NEW_SHEET]?.data.length || 0; }
  function cell(field, row = rows() - 1) {
    const sheet = sheets[NEW_SHEET];
    const column = sheet.data[0].indexOf(field);
    assert.notEqual(column, -1, field);
    return sheet.data[row][column];
  }
  function unchangedLegacy() { assert.deepEqual(sheets.Responses.data, legacyData); }
  if (initialize) context.setupSurveySheet();
  return { context, schema, state, sheets, properties, packet, event, submit, rows, cell, unchangedLegacy, Sheet };
}

test('backend and frontend use the same v2.1 schema: Q15 liking, Q16 interest, both required for eligible respondents', () => {
  const h = harness();
  assert.deepEqual(h.schema, JSON.parse(fs.readFileSync(path.join(siteRoot, 'survey.json'), 'utf8')));
  assert.equal(h.schema.version, '2.1');
  const q = id => h.schema.sections.flatMap(s => s.questions).find(item => item.id === id);
  assert.match(q('Q15').text, /like/);
  assert.deepEqual([q('Q15').min, q('Q15').max, q('Q15').condition, q('Q15').required], [0, 10, 'eligible', true]);
  assert.match(q('Q16').text, /interested/);
  assert.deepEqual([q('Q16').min, q('Q16').max, q('Q16').condition, q('Q16').required], [1, 5, 'eligible', true]);
  for (const id of ['Q15', 'Q16']) assert.deepEqual(q(id).productConditions, { S: 'eligible', B: 'eligible' });
  assert.deepEqual([q('Q24').min, q('Q24').max, q('Q24').decimals], [0, 168, 2]);
});

test('36 combinations show liking 0/1/10 never controls routing; Q16 interest 1/5 does for each product', () => {
  const h = harness();
  for (const likeS of [0, 1, 10]) for (const likeB of [0, 1, 10]) {
    for (const interestS of [1, 5]) for (const interestB of [1, 5]) {
      const input = h.packet({
        Q15_S: likeS, Q15_B: likeB, Q16_S: interestS, Q16_B: interestB,
        Q17_S: [1], Q17_B: [1],
        Q24_S: 0.5, Q24_B: 1.25, Q25_S: 0, Q25_B: 0,
        Q27_S: 1, Q27_B: 1, Q28_S: [1], Q28_B: [1]
      });
      assert.match(h.submit(input), successText);
      for (const [product, liking, interest] of [['S', likeS, interestS], ['B', likeB, interestB]]) {
        const interested = interest === 5;
        assert.equal(h.cell(`V_Q15_${product}`), String(liking), 'liking must remain even when uninterested');
        assert.equal(h.cell(`V_Q15_${product}__asked`), '1');
        assert.equal(h.cell(`V_Q16_${product}`), String(interest));
        assert.equal(h.cell(`V_Q16_${product}__asked`), '1');
        assert.equal(h.cell(`V_Q17_1_${product}`), interested ? '' : '1');
        assert.equal(h.cell(`V_Q17_1_${product}__asked`), interested ? '0' : '1');
        assert.equal(h.cell(`V_Q24_${product}`), interested ? (product === 'S' ? '0.5' : '1.25') : '');
        assert.equal(h.cell(`V_Q24_${product}__asked`), interested ? '1' : '0');
        assert.equal(h.cell(`V_Q27_${product}`), interested ? '1' : '');
        assert.equal(h.cell(`V_Q28_1_${product}`), interested ? '1' : '');
        assert.equal(h.cell(`V_Q29_1_${product}__asked`), '0');
      }
      for (const id of ['Q26', 'Q30', 'Q31', 'Q32']) {
        assert.equal(h.cell(`V_${id}__asked`), interestS === 5 || interestB === 5 ? '1' : '0');
      }
    }
  }
  assert.equal(h.rows(), 37);
  h.unchangedLegacy();
});

test('liking and interest remain separately required with distinct 0–10 and 1–5 boundaries', () => {
  const h = harness();
  for (const product of ['S', 'B']) {
    for (const value of [-1, 11, 0.5, '', undefined]) {
      assert.match(h.submit(h.packet({ [`Q15_${product}`]: value })), /could not be saved/);
    }
    for (const value of [0, 6, 1.5, '', undefined]) {
      assert.match(h.submit(h.packet({ [`Q16_${product}`]: value })), /could not be saved/);
    }
  }
  assert.equal(h.rows(), 1);
});

test('setup expands a new 26-column tab to 203 columns without altering legacy Responses', () => {
  const h = harness();
  const sheet = h.sheets[NEW_SHEET];
  assert.equal(sheet.maxColumns, 203);
  assert.equal(sheet.data[0].length, 203);
  assert.equal(new Set(sheet.data[0]).size, 203);
  assert.equal(sheet.frozenRows, 1);
  assert.deepEqual(h.state.expansions, [{ sheet: NEW_SHEET, after: 26, count: 177 }]);
  h.unchangedLegacy();
  const before = copy(sheet.data);
  h.context.setupSurveySheet();
  assert.deepEqual(sheet.data, before);
  assert.equal(h.state.expansions.length, 1);
  assert.equal(h.state.locked, false);
});

test('setup also expands an already-created empty new tab, and preserves wider empty grids', () => {
  for (const columns of [26, 250]) {
    const h = harness({ initialize: false });
    h.sheets[NEW_SHEET] = new h.Sheet(NEW_SHEET, columns);
    h.context.setupSurveySheet();
    assert.equal(h.sheets[NEW_SHEET].maxColumns, Math.max(columns, 203));
    assert.equal(h.sheets[NEW_SHEET].data[0].length, 203);
    assert.equal(h.state.expansions.length, columns < 203 ? 1 : 0);
    h.unchangedLegacy();
  }
});

test('all Q4/Q6/Q11 category codes are accepted and stored as their codes', () => {
  const h = harness();
  for (const [id, highest] of [['Q4', 7], ['Q6', 6], ['Q11', 7]]) {
    for (let value = 1; value <= highest; value++) {
      assert.match(h.submit(h.packet({ [id]: value })), successText);
      assert.equal(h.cell('V_' + id), String(value));
      assert.equal(h.cell('V_' + id + '__asked'), '1');
    }
  }
  assert.equal(h.rows(), 21);
  h.unchangedLegacy();
});

test('invalid category codes and old numeric measurements outside the code set are rejected', () => {
  const h = harness();
  const cases = { Q4: [0, 8, 21, 1.5, '', [2]], Q6: [0, 7, 0.5, 2.5, '', [2]], Q11: [0, 8, 50, 1.5, '', [2]] };
  for (const [id, values] of Object.entries(cases)) for (const value of values) {
    const html = h.submit(h.packet({ [id]: value }));
    assert.match(html, /could not be saved/);
    assert.ok(!successText.test(html), `${id}=${JSON.stringify(value)}`);
  }
  assert.equal(h.rows(), 1);
  h.unchangedLegacy();
});

test('weekly hours preserve 0, 0.5, 1.25 and the 168-hour boundary without converting to minutes', () => {
  const h = harness();
  for (const value of [0, 0.5, 1.25, 168]) {
    assert.match(h.submit(h.packet({ Q24_S: value })), successText);
    assert.equal(h.cell('V_Q24_S'), String(value));
    assert.equal(h.cell('V_Q24_S__asked'), '1');
    assert.equal(h.cell('V_Q24_B'), '');
    assert.equal(h.cell('V_Q24_B__asked'), '0');
  }
});

test('weekly hours reject 169, negative values, excessive precision and missing answers', () => {
  const h = harness();
  for (const value of [169, 168.01, -0.01, 1.234, '', 'not a number']) {
    assert.match(h.submit(h.packet({ Q24_S: value })), /could not be saved/);
  }
  assert.equal(h.rows(), 1);
});

test('version 2.0 is rejected before writing either the old or new tab', () => {
  const h = harness();
  const input = h.packet();
  input.schemaVersion = '2.0';
  input.answers.Q4 = 21;
  input.answers.Q6 = 1.5;
  input.answers.Q11 = 80;
  input.answers.Q24_S = 120;
  const beforeWrites = h.state.writes.length;
  assert.match(h.submit(input), /version is no longer accepted/);
  assert.equal(h.state.writes.length, beforeWrites);
  assert.equal(h.rows(), 1);
  h.unchangedLegacy();
});

test('valid receipt matches the saved ID/time; server recomputes derived values and clears hidden answers', () => {
  const h = harness();
  const input = h.packet({ Q17_S: [7], Q17_S__7_text: 'hidden', Q24_B: 169 });
  input.flat = { V_Q1: 0, V_Q24_S: 60 };
  input.asked = { Q1: false };
  const html = h.submit(input);
  assert.match(html, successText);
  assert.ok(html.includes(input.responseId));
  const receivedAt = h.cell('received_at_utc');
  assert.match(receivedAt, /^\d{4}-\d{2}-\d{2}T.+Z$/);
  assert.ok(html.includes(receivedAt));
  assert.equal(h.cell('submission_id'), input.responseId);
  assert.equal(h.cell('survey_version'), '2.1');
  assert.equal(h.cell('V_Q1'), '1');
  assert.equal(h.cell('V_Q24_S'), '0.5');
  assert.equal(h.cell('V_Q17_7_S'), '');
  assert.equal(h.cell('V_Q17_7_S__asked'), '0');
  assert.equal(h.cell('V_Q24_B'), '');
  assert.equal(h.cell('V_Q33'), "'=1+1");
  assert.ok(h.state.writes.every(write => write.sheet === NEW_SHEET));
  h.unchangedLegacy();
});

test('identical submissions are idempotent and return the original receipt timestamp', () => {
  const h = harness();
  const input = h.packet();
  assert.match(h.submit(input), successText);
  const saved = copy(h.sheets[NEW_SHEET].data[1]);
  const timestamp = h.cell('received_at_utc');
  const html = h.submit(input);
  assert.match(html, /already received/);
  assert.ok(html.includes(input.responseId));
  assert.ok(html.includes(timestamp));
  assert.equal(h.rows(), 2);
  assert.deepEqual(h.sheets[NEW_SHEET].data[1], saved);
});

test('same ID with changed canonical answers is rejected without overwriting the saved row', () => {
  const h = harness();
  const input = h.packet();
  h.submit(input);
  const saved = copy(h.sheets[NEW_SHEET].data);
  input.answers.Q24_S = 1.25;
  assert.match(h.submit(input), /different answers/);
  assert.deepEqual(h.sheets[NEW_SHEET].data, saved);
  assert.equal(h.state.locked, false);
});

test('missing new tab never falls back to legacy Responses', () => {
  const h = harness({ initialize: false });
  assert.match(h.submit(h.packet()), /could not be saved/);
  assert.equal(h.sheets[NEW_SHEET], undefined);
  assert.equal(h.state.writes.length, 0);
  assert.equal(h.state.locked, false);
  h.unchangedLegacy();
});

test('incompatible populated new-tab headers block setup and submission without changes', () => {
  const h = harness();
  h.sheets[NEW_SHEET].data[0][8] = 'incorrect_header';
  const before = copy(h.sheets[NEW_SHEET].data);
  assert.throws(() => h.context.setupSurveySheet(), /headers mismatch/);
  assert.match(h.submit(h.packet()), /could not be saved/);
  assert.deepEqual(h.sheets[NEW_SHEET].data, before);
  assert.equal(h.state.locked, false);
  h.unchangedLegacy();
});

test('storage failure gives no success receipt, releases the lock, and allows a safe retry', () => {
  const h = harness();
  const input = h.packet();
  h.state.failWrite = true;
  const html = h.submit(input);
  assert.match(html, /could not be saved/);
  assert.ok(!successText.test(html));
  assert.ok(!html.includes('Receipt:'));
  assert.equal(h.rows(), 1);
  assert.equal(h.state.locked, false);
  h.state.failWrite = false;
  assert.match(h.submit(input), successText);
  assert.equal(h.rows(), 2);
  h.unchangedLegacy();
});

test('failure after a row write is recoverable by retry without a duplicate row', () => {
  const h = harness();
  const input = h.packet();
  h.state.failFlush = true;
  assert.match(h.submit(input), /could not be saved/);
  assert.equal(h.rows(), 2);
  assert.equal(h.state.locked, false);
  h.state.failFlush = false;
  assert.match(h.submit(input), /already received/);
  assert.equal(h.rows(), 2);
});

test('lock timeout and invalid configuration cannot write a response or claim success', () => {
  const h = harness();
  h.state.failLock = true;
  assert.match(h.submit(h.packet()), /could not be saved/);
  assert.equal(h.state.locked, false);
  h.state.failLock = false;
  h.properties.SPREADSHEET_ID = '';
  assert.match(h.submit(h.packet()), /could not be saved/);
  assert.equal(h.rows(), 1);
  h.unchangedLegacy();
});

test('ineligible, incomplete, malformed, oversized and unknown-field payloads do not write', () => {
  const h = harness();
  assert.match(h.submit(h.packet({ Q1: 0 })), /No response was saved/);
  const incomplete = h.packet();
  delete incomplete.answers.Q20_S;
  assert.match(h.submit(incomplete), /review the questionnaire/);
  assert.match(h.submit(h.packet({ UNKNOWN: 'x' })), /unknown question/);
  assert.match(h.submit(h.packet({ Q2: { text: 'x' } })), /invalid format/);
  assert.match(h.submit('{'), /could not be read/);
  assert.match(h.submit('x'.repeat(32769)), /too large/);
  const duplicateParameter = h.event(h.packet());
  duplicateParameter.parameters.payload.push(duplicateParameter.parameter.payload);
  assert.match(h.context.doPost(duplicateParameter).html, /format is invalid/);
  assert.equal(h.rows(), 1);
});

test('GET and failure pages do not disclose stored answers or accept a payload return URL', () => {
  const h = harness();
  h.submit(h.packet());
  const get = h.context.doGet().html;
  assert.ok(!get.includes('SYNTHETIC OFFLINE TEST'));
  assert.ok(!get.includes(h.properties.SPREADSHEET_ID));
  const input = h.packet();
  input.returnUrl = 'https://attacker.example/';
  const html = h.submit(input);
  assert.match(html, /unsupported fields/);
  assert.ok(!html.includes('attacker.example'));
  assert.ok(html.includes(h.properties.RETURN_URL));
  assert.equal(h.rows(), 2);
});
