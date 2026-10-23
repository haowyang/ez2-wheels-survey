# Unified Google Sheets collector for survey 3.2

`UnifiedCollector.gs` is the only Apps Script source to deploy. It preserves the complete 2.2, 2.3, 2.4 and 3.1 engines unchanged and adds the 3.2 engine. Do not append old `Schema.gs`, `Logic.gs`, `Code.gs` or the historical test fixtures.

Release source SHA-256: `da4585cbcd87bdff54b9f692f58b80ac9738b80351ddacbe7c7fd6a96759a11a`.

## Existing Responses table: 413 columns, no expansion for 3.2

All accepted versions (2.2, 2.3, 2.4, 3.1 and 3.2) write to the existing private `Responses` tab. Versions 2.0, 2.1 and unknown versions are rejected. The complete physical order in `headers.json` is identical to the 3.1 release: seven metadata columns, 210 legacy value/asked cells and 196 `v3_1__` value/asked cells.

Versions 3.1 and 3.2 share the same 98 analysis field names and the **existing `v3_1__` storage prefix**. There are no `v3_2__` columns. `survey_version` distinguishes the routing contract:

- In 3.1, Q6 is shown to all eligible respondents and code 99 produces a blank value with asked=1. In 3.2, Q6 is shown only when Q1=1 and Q5=1; on-campus answers must be categories 1–5. Off-campus Q6 answers are removed, giving blank/asked0. Code 99 is invalid when Q6 is asked in 3.2.
- In 3.1, Q31 is shown only when at least one product is interesting. In 3.2, Q31 is required for every eligible respondent, including those uninterested in both products. Its valid 0–10 scale is unchanged. Q32 still depends on product interest.
- A 3.1/3.2 row leaves legacy analysis values blank with asked0; a 2.2/2.3/2.4 row leaves all `v3_1__` values blank with asked0. Hidden fields are blank/asked0; a substantive zero is retained with asked1.
- Raw browser answer keys and JSON/CSV exports retain schema-native names. Only the storage projection prefixes analysis columns. The canonical digest includes the source version, so changing version under the same response ID cannot overwrite an earlier response.

The companion `Codebook` documents the same 413 physical columns, with Q6 and Q31 definitions separated by source version. Historical values, source versions, IDs, timestamps and digests must be preserved. Use version-aware denominators when analyzing these two questions.

The browser backup CSV has 201 columns (five local metadata plus 196 value/asked columns); it is not the unified Sheet layout. The 3.2 browser importer accepts 3.2 records only and recomputes derived fields.

## Deploy against the current 413-column table

1. Keep a private backup of Responses, Codebook and the prior script source. Keep `SPREADSHEET_ID`, `RETURN_URL` and existing deployment URLs.
2. Replace the source with this single `UnifiedCollector.gs` and retain `appsscript.json`. Update every active deployment in the same Apps Script project to the same tested script version.
3. Run `setupSurveySheet()` to verify the exact 413 headers. It performs no writes. No header migration or grid expansion is needed for 3.2.
4. If `upgradeUnifiedHeaders()` is run on the already complete table, it validates the existing layout and returns `alreadyComplete: true, mutated: false`. It leaves both historical rows and new 3.1/3.2 rows unchanged.
5. Verify public assets and clearly marked synthetic submissions before distribution. Clear only precisely identified QA rows after independently checking their receipt ID, marker and values.

No function creates, renames or deletes a response table. Do not commit real answers, private backups or live QA receipts to the public repository.

## Retained recovery for historical 217-column installations

The prior 217-to-413 helper remains available for interrupted historical upgrades. Old 2.2/2.3/2.4 submissions can continue writing 217 columns until initialization is complete; both 3.1 and 3.2 return an explicit not-ready error. This recovery path is unnecessary for an existing correct 413-column table.

Under the shared ScriptLock, recovery verifies the exact 217-column prefix, initializes only columns 218–413 for historical rows, and commits headers after readback verification. Reads/writes are bounded to 100 used rows per batch. It never writes the first 217 columns. Unexpected new-column contents or changes to original cells prevent completion. Interrupted batches, partial header writes and flush failures can be retried safely, including intervening old-version submissions.

Submissions use the same lock. Repeating an ID with the same canonical digest returns the original receipt and timestamp; conflicting reuse is rejected. The backend ignores client-provided `flat`, `asked` and title values and recomputes them. Literal rich-text writes and CSV safeguards prevent formulas. Receipts expose no stored-answer retrieval.

## Offline verification

```sh
npm test
npm run test:collector
```

The 51 backend tests load this actual collector with in-memory services and make no real submissions. They cover four frozen historical engines, 180 five-version canonical/digest combinations, 108 additional residence/product/experience/charger combinations, all 413 projected cells, the 3.1 versus 3.2 Q6/Q31 difference, Other fields, malformed payloads, privacy and formula safety, duplicate/failed writes, existing-413 no-op validation, historical 501-row upgrade, partial failure recovery and lock contention.

The frozen `original-3.1.gs.txt` is the independent source/behavior oracle for the immediately preceding release. `previous-release-headers.json` freezes all 413 headers; `previous-unified-headers.json` retains the historical 217-column contract. Files under `testing/qa/` contain synthetic offline packets only.
