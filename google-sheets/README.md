# Unified Google Sheets collector for survey 3.3

`UnifiedCollector.gs` is the only Apps Script source to deploy. It preserves the complete 2.2, 2.3, 2.4, 3.1 and 3.2 engines unchanged and adds the 3.3 engine. Do not append old `Schema.gs`, `Logic.gs`, `Code.gs` or the historical test fixtures.

Release source SHA-256: `fe5e347759662a48a73d5d65a50ffe83ef4ef57d3d07f4e48940b233cb3abd7f`.

## Existing Responses table: 413 columns, no expansion for 3.3

All accepted versions (2.2, 2.3, 2.4, 3.1, 3.2 and 3.3) write to the existing private `Responses` tab. Versions 2.0, 2.1 and unknown versions are rejected. The physical order in `headers.json` remains identical to 3.1 and 3.2: seven metadata columns, 210 legacy value/asked cells and 196 `v3_1__` value/asked cells.

Versions 3.1–3.3 share the same 98 analysis field names and the **existing `v3_1__` storage prefix**. There are no new `v3_3__` columns. Use `survey_version` and Codebook when interpreting the values:

- **Q24:** In 3.1/3.2, code 0 is an explicit zero-use category, and code 1 means more than zero but less than 15 minutes. In 3.3, only codes 1–5 are valid. Code 1 is “Less than 15 minutes (or only occasionally)” and covers [0,15) minutes per week; it includes zero but does not identify exact zero use. Do not turn code 1 into measured minutes or impute an exact zero. Q24 remains conditional on interest in at least one product. A stale hidden answer is removed.
- **Q32:** In 3.1/3.2, the values are recommendation single-choice codes 1/2/3 and only interested respondents see the question. In 3.3, Q32 is a required 0–10 integer rating for every eligible respondent. The stored field is still `v3_1__V_Q32`, so a value such as 1 has different meanings across versions. Never pool these versions as one unchanged recommendation scale.
- **Q6:** In 3.1, this is shown to all eligible respondents and code 99 becomes blank/asked1. In 3.2/3.3, it is asked only when Q1=1 and Q5=1; on-campus answers must be categories 1–5. Off-campus answers are removed, producing blank/asked0.
- **Q31:** In 3.1, it requires interest in at least one product. In 3.2/3.3, its unchanged 0–10 scale is required for all eligible respondents.
- A 3.1/3.2/3.3 row leaves legacy analysis values blank with asked0. A 2.2/2.3/2.4 row leaves all `v3_1__` values blank with asked0. Hidden fields are blank/asked0. A genuine scale zero, including 3.3 Q32=0, is retained as 0 with asked1.

Raw browser answer keys and JSON/CSV retain schema-native names. Only storage projection applies the prefix. The canonical digest includes source version, so reusing an ID under another version cannot overwrite the prior response. Historical values, source versions, IDs, timestamps and digests are preserved.

The companion `Codebook` documents all 413 physical columns and version differences. The browser backup CSV has 201 columns (five local metadata plus 196 value/asked columns), not the unified Sheet layout. The 3.3 browser importer accepts only 3.3 records and recomputes derived values.

## Deploy against the current 413-column table

1. Keep a private backup of Responses, Codebook and the prior script source. Retain `SPREADSHEET_ID`, `RETURN_URL` and every existing deployment URL.
2. Replace the source with this single `UnifiedCollector.gs` and retain `appsscript.json`. Update every active deployment in the same Apps Script project to the same tested script version.
3. Run `setupSurveySheet()` to verify the exact 413 headers. It performs no writes. No header migration or grid expansion is needed for 3.3.
4. If `upgradeUnifiedHeaders()` is run on the complete table, it returns `alreadyComplete: true, mutated: false` after validation. It leaves all old rows and new 3.3 rows unchanged.
5. Verify public resources and clearly marked synthetic submissions. Clear only exactly identified QA rows after independently checking receipt ID, marker and every value.

No function creates, renames or deletes a response table. Do not commit real answers, private backups or live QA receipts to the public repository.

## Retained recovery for historical 217-column installations

The prior 217-to-413 helper remains available for interrupted historical upgrades. Old 2.2/2.3/2.4 submissions can continue writing 217 columns until initialization completes; 3.1/3.2/3.3 requests receive an explicit not-ready error. This recovery path is unnecessary for an already correct 413-column table.

The shared ScriptLock protects recovery and submissions. Recovery verifies the exact 217-column prefix, initializes only columns 218–413 for historical rows and commits headers after readback. Operations are bounded to 100 used rows per batch, and no recovery path writes the first 217 columns. Unexpected new-column contents or concurrent manual changes prevent completion. Interrupted batches, partial header writes and flush failures can be retried safely.

Repeating an ID with the same canonical digest returns its original receipt and receive time; conflicting reuse is rejected. The backend ignores client-derived `flat`, `asked` and title values. Literal rich-text writes and CSV safeguards prevent formulas. Receipts never expose stored-answer retrieval.

## Offline verification

```sh
npm test
npm run test:collector
```

The 61 backend tests use the actual collector with in-memory services and make no real submissions. Coverage includes five frozen historical engines, 216 six-version canonical/digest combinations, 108 additional 3.2 route cases, 144 additional 3.3 route cases, all 413 projected cells, Q24 category boundaries and rejection of obsolete zero code, all 44 Q32 integer-rating/product-interest combinations, unchanged older single-choice semantics, no-op existing-413 setup/upgrade, historical 501-row recovery, partial failures, lock contention, duplicates, malformed input, privacy and formula safety.

`original-3.2.gs.txt` is the independent source/behavior oracle for the preceding release. `previous-release-headers.json` freezes all 413 headers; `previous-unified-headers.json` retains the historical 217-column contract. `testing/qa/` contains only synthetic offline packets.
