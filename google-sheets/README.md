# Unified Google Sheets collector for survey 2.4

`UnifiedCollector.gs` is the only Apps Script source to deploy. It embeds the original 2.2 and 2.3 engines unchanged and adds the finalized 2.4 engine. Do not append old `Schema.gs`, `Logic.gs`, or `Code.gs` files, and do not paste anything from `testing/` into Apps Script. The source SHA-256 for this release is `d849cd5c4e7a5f65b587f5e76f68263d1a42d9fb2a81def87ef4d3bbf92a4811`.

## One response table, append-only columns

Accepted versions 2.2, 2.3, and 2.4 all write to the existing private `Responses` tab. Versions 2.0 and 2.1 are rejected. The companion `Codebook` explains all fields and their version-specific meanings; submissions do not modify the Codebook.

The exact 217-column order is in `headers.json`. The previous 215 columns retain their original positions. Only `V_Q8_9` and `V_Q8_9__asked` are appended, at columns 216 and 217. The 2.4 source schema has 99 analysis fields plus 99 indicators and seven collector metadata fields; the unified layout additionally retains the six legacy continuous-value fields and their indicators.

- Historical 2.2/2.3 responses receive a blank new Q8 value and `__asked=0`; no prior answer is inferred.
- In an eligible 2.4 response, `V_Q8_9=1` means the exclusive None option was selected. It is 0 when another Q8 option was selected, with `__asked=1` in both cases. A request combining None with any other option is rejected.
- Q14 code 99 is available only in 2.4. It remains in canonical raw answers but exports a blank analysis value and `V_Q14__asked=1`. A hidden Q14 instead has `__asked=0`.
- The six legacy continuous fields remain separate from the six category fields ending in `_band` (with product suffixes where relevant). Old numeric values are not reinterpreted as categories. A meaningful zero remains zero; declared missing code 99 exports blank while retaining `__asked=1`.
- Q5 and Q12 wording changed in 2.4 while retaining their field names. Interpret these fields using `survey_version` and the matching Codebook definitions.
- Existing IDs, receive times, source versions, answer key order, and digest semantics remain unchanged. Repeated ID plus identical canonical digest returns the original receipt; conflicting reuse fails without replacing the earlier response.

The 2.4 browser's backup CSV has 203 columns (five local metadata plus 198 analysis/indicator columns). It is intentionally different from the 217-column Sheet. The 2.4 browser importer accepts only 2.4 records, although the collector supports all three current source versions.

## Deploy before upgrading the existing headers

1. Keep a private backup of the existing response table and Apps Script source. Preserve `SPREADSHEET_ID`, `RETURN_URL`, and the existing deployment URLs.
2. Replace the Apps Script project source with this single `UnifiedCollector.gs`, using the accompanying `appsscript.json` manifest. Update **all active deployment URLs** in the same project to the same new script version before upgrading the table.
3. Before the upgrade, valid 2.2 and 2.3 requests continue writing the exact old 215-column layout to `Responses`. A 2.4 request receives an explicit not-ready failure. No fallback table is created or used.
4. Run `upgradeUnifiedHeaders()` manually. It takes the same ScriptLock as submissions. It verifies the exact old 215-column prefix, initializes only the two new cells of historical responses to blank/0, and reads them back. It also checks every old cell against its snapshot. It writes the two new headers only after those checks succeed. Blank row gaps remain blank. If the physical grid needs more columns, it adds only the missing columns at the end.
5. Run `setupSurveySheet()`. It only verifies the completed 217 headers; it never creates a table or changes cells.
6. Independently verify that every old cell, response ID, timestamp, version, and hash is unchanged, that historical new fields are blank/0, and that new synthetic 2.4 submissions and duplicate receipts behave correctly. Clear only specifically identified QA rows after verification.

This release has no `consolidateResponses()` function and no table creation, renaming, or deletion code. It does not migrate responses to another table.

## Failure and retry behavior

The header upgrade never writes to columns 1–215. If expansion, initialization, readback, or header writing fails, earlier response values remain intact. An exact old prefix with empty or partially written expected new headers remains recoverable; 2.2/2.3 can continue submitting while 2.4 remains blocked until the complete new header is present. A retry includes any old-version rows received in that interval.

Unexpected new-column data is not overwritten. Changes to old cells or row counts during upgrade stop the final header commit. When the 217 headers are complete, rerunning the upgrade validates historical initialization and returns without rewriting responses, including any newer 2.4 rows. A failure after the header commit can therefore be retried safely. All request and upgrade paths share the same script lock.

Do not put real answers, private exports, or backups in this repository. A deployed collector returns only the submitter's receipt; it has no endpoint for reading saved answers. Data writes are literal and retain spreadsheet/CSV formula safeguards.

## Offline verification

From the website directory:

```sh
npm test
npm run test:collector
```

`tests/backend.test.cjs` loads the actual release collector and runs 28 offline integration tests. Coverage includes the full frozen 2.2/2.3 engine source, 216 version/routing combinations, Q8 exclusivity, Q14 missingness, all prior field meanings, duplicate digests, 215-column compatibility, 217-column setup, header upgrade failures/retries, 501 historical rows over several write batches, blank gaps, manual-edit detection, and lock contention. The mock asserts that header upgrade writes touch only columns 216–217. No test sends live requests.

The other tests verify all 33 questions and the actual frontend against the embedded 2.4 engine. `testing/fixtures/*.gs.txt` are historical test oracles, not deployment files. `testing/fixtures/previous-unified-headers.json` preserves the prior exact column order. `testing/qa/packet-*.json` contain synthetic test answers only, not real responses or live receipts.
