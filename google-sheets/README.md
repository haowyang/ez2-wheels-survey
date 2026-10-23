# Unified Google Sheets collector for survey 3.1

`UnifiedCollector.gs` is the only Apps Script source to deploy. It retains the full 2.2, 2.3 and 2.4 engines unchanged and adds the finalized 3.1 engine. Never append old `Schema.gs`, `Logic.gs` or `Code.gs` files, and never paste the historical fixtures under `testing/` into Apps Script.

Release source SHA-256: `686437dd3502f736606aab24fe4b2ebd43115f1e4b249e34829768938f7ee074`.

## One Responses table; separate question meanings

Accepted versions 2.2, 2.3, 2.4 and 3.1 all use the existing private `Responses` tab. The seven metadata fields remain shared, including the original `survey_version`, submission ID, receive timestamp, randomized plan order and canonical payload digest. The collector rejects 2.0, 2.1 and unrecognized versions.

The complete order is in `headers.json`: **413 columns**, with the prior **217 columns preserved in their existing positions**, followed by 196 new cells (98 version-3.1 analysis fields plus 98 asked indicators).

Survey 3.1 renumbers and changes many questions. Consequently every 3.1 analysis column is physically prefixed `v3_1__`, even where its raw field name resembles an old question. For example, frontend `V_Q14` is stored as `v3_1__V_Q14`, and its indicator is `v3_1__V_Q14__asked`. No prior analysis column is reused for a 3.1 answer.

- A 3.1 row leaves all old analysis values blank and their asked indicators 0.
- A 2.2/2.3/2.4 row leaves all 3.1 values blank and their asked indicators 0.
- A field hidden by a condition is blank with asked=0. A declared missing response is blank with asked=1. A substantive zero remains zero. Use the source version and Codebook to distinguish these cases.
- Raw answer keys and browser JSON/CSV keep the teammate's schema-native names. The prefix is applied only by the collector's storage projection, after canonical validation and cleanup. It does not change raw answers, question semantics, randomized plan codes or digest calculation.
- The new Q3 single-choice Other requires a nonblank detail of at most 40 characters. Its raw field `V_Q3_Other_txt` maps to `v3_1__V_Q3_Other_txt`. Deselecting Other removes stale detail on both client and server.
- In 3.1, experience is Q13 Yes; product interest is Q18; product plan choice is Q26; charging interest is Q29. Each version's engine independently handles its own numbering and conditions.

The companion `Codebook` tab describes all 413 physical columns and their version-specific meanings. Submissions do not modify it. Interpret 3.1 and earlier questions using their own definitions; do not combine fields merely because raw names match.

The 3.1 browser backup CSV has 201 columns (five local metadata plus 196 analysis/indicator columns). The source collector record has seven metadata plus those 196 cells. Neither is the unified Sheet layout, and the browser importer accepts only version 3.1 records.

## Deploy before expanding the existing headers

1. Preserve a private backup of `Responses` and the previous Apps Script source. Keep the existing `SPREADSHEET_ID`, `RETURN_URL`, and all deployment URLs.
2. Replace the Apps Script source with this single file and retain the provided `appsscript.json` manifest. Update **all active deployments in the same project** to the same tested script version before the header upgrade.
3. During this interval, 2.2/2.3/2.4 submissions continue writing exactly 217 columns to the existing `Responses`. A 3.1 submission receives an explicit not-ready error. No other response tab is used or created.
4. Manually run `upgradeUnifiedHeaders()`. Under the same ScriptLock used by submissions, it verifies the exact 217-column prefix and initializes historical new cells to blank/asked0. It reads and writes only the actual used rows, in batches of at most 100 rows, and touches only columns 218–413. Blank row gaps remain blank. It verifies every original cell against its snapshot and commits the 196 new headers only after all checks pass.
5. Run `setupSurveySheet()` to verify the completed 413 headers. This function performs validation only; it never creates a table or edits values.
6. Independently verify preservation of every old cell, IDs, timestamps, source versions and digests. Verify historical new cells and explicitly marked 3.1 synthetic submissions; clear only precisely matched QA rows after verification.

No function creates, renames or deletes a table. The header upgrade only expands the physical grid at its end if necessary and writes the new namespace columns. It never rewrites, moves, clears, or reinterprets the first 217 columns.

## Safe interruption and retry

Old headers remain in place until initialization and readback succeed. If expansion, a write batch, readback, or a partial header write fails, the old versions can continue submitting against the preserved 217-column contract. New 3.1 requests remain blocked until the full new header exists. Retrying includes any old-version rows received during recovery.

Unexpected new-column data is never overwritten. A change to original cells or row count during the upgrade prevents the header commit. Once the complete header exists, a repeated upgrade validates historical initialization and does not rewrite responses, including newly received 3.1 rows. An applied header write followed by a flush error is therefore recoverable without losing or duplicating data.

A repeated response ID with the same canonical digest returns the original receipt and receive time. Conflicting reuse fails without changing the first row. Version-specific canonical answer order and the SHA-256 algorithm remain unchanged. The server does not trust browser-provided derived `flat`, `asked` or title fields.

The collector exposes receipts only, never saved-answer retrieval. Writes remain literal and preserve spreadsheet/CSV formula protections. Do not commit real answers, private exports, backups or live QA receipts to this public repository.

## Offline tests

From the website directory:

```sh
npm test
npm run test:collector
```

The package test command loads the actual release collector. Its 41 backend tests cover unchanged legacy source, 288 canonical/digest route combinations, all 413 projected cells, name collisions, Other handling, new conditions, the eight requested screenshot requirements, duplicate IDs, malformed payloads, bounded 501-row upgrade, inter-batch/partial-header/flush failure recovery, old-version submissions during recovery, manual-edit detection and lock contention. Upgrade tests assert that only the new columns are written.

The full package also tests all 33 questions, frontend/schema consistency, browser import/export, 1,600 route combinations, and per-product pricing rendering. These tests use local mock services and make no real submissions.

`testing/fixtures/original-2.2.gs.txt` and `original-2.3.gs.txt` retain historical sources. `original-2.4.gs.txt` is the exact previous complete unified collector, used as an independent oracle. `previous-unified-headers.json` freezes all 217 previous headers. The packets under `testing/qa/` are synthetic inputs only and contain no real responses or credentials.
