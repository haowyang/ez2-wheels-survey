# Google Sheets collection for the 2.3 release

The website uses the existing deployed unified collector. `UnifiedCollector.gs` is the **only Apps Script source file** in this release. It is byte-for-byte the source deployed as Apps Script version 4 on 2026-10-22; publishing the 2.3 website does not require a new collector deployment.

SHA-256: `30a0e13823afdee8c51fa1b87820f524b945318578778e2e959d0ec4baa7f716`.

The former separate `Schema.gs`, `Logic.gs`, and `Code.gs` files are deliberately absent. Their declarations would collide with the two embedded engines in the unified source. Historical comments inside the frozen engines retain their original wording; they do not describe the current deployment status.

## Storage and interpretation

- All accepted submissions go to the single `Responses` tab. Its exact **215 headers** are in `headers.json`: seven metadata columns, the 2.3 survey's 98 analysis fields and 98 `__asked` indicators, then six legacy continuous-value fields and their six indicators.
- The companion `Codebook` tab explains the unified fields and version-specific meanings. It is documentation; submissions never modify it.
- `schemaVersion: "2.2"` uses the original 2.2 engine and `schemaVersion: "2.3"` uses the original 2.3 engine. The source `survey_version`, original answer meanings, and digest algorithm are preserved. Versions 2.0 and 2.1 are rejected.
- The six 2.3 category fields are `V_Q23_band`, `V_Q24_band_S`, `V_Q24_band_B`, `V_Q25_band_S`, `V_Q25_band_B`, and `V_Q26_band`. The corresponding un-suffixed legacy fields retain the continuous values supplied by 2.2; they must not be recoded as band numbers.
- A field absent from a response's schema is blank with `__asked=0`. A conditionally hidden field is also blank with `__asked=0`; distinguish these cases using `survey_version` and the Codebook. A visible answer whose schema marks code `99` as missing is blank with `__asked=1`. A substantive zero remains zero.
- A repeated ID with the same canonical digest returns the original receipt without adding a row. Reusing an ID with different canonical answers fails. The collector validates and cleans answers itself and ignores client-supplied analysis fields.

The frontend's backup CSV remains specific to version 2.3 and has 201 columns (five local metadata columns plus 196 analysis/indicator columns). It is not the unified Sheet layout. Do not import mixed-version records through the 2.3 browser backup tool.

## Existing deployment

Keep the website's configured `/exec` URL and the existing `SPREADSHEET_ID` and `RETURN_URL` Script Properties. The project runs under the deploying owner's account and accepts anonymous submissions. The response sheet remains private; the collector exposes a receipt only and does not offer a response-reading endpoint.

If maintaining the Apps Script project, paste only `UnifiedCollector.gs` into one source file, replacing the prior source rather than appending it. Use `appsscript.json` as the project manifest. Never paste files from `testing/`. If backend code is intentionally changed in a later release, update every active deployment in the same project to the same tested script version so that they share the same validation, destination, and lock behavior.

`setupSurveySheet()` only verifies the existing 215-column `Responses` header. It does not create a tab, rewrite headers, expand a grid, or modify response rows. Missing or mismatched headers stop collection instead of overwriting data.

## Historical migration helper

Consolidation was completed before this website release. Do not run migration simply to publish the website.

The retained `consolidateResponses()` helper uses the same ScriptLock as submission. It can map a strictly validated 2.2 source into staging, verify every cell, and promote the staging tab while preserving source tables. It requires the old 2.0/2.1 response tabs to contain no answers. Before a unified table exists, the compatibility path accepts only 2.2 into a strictly validated `Responses_v2_2`; 2.3 receives a not-ready error. Once `Responses` has the exact 215-column header, all accepted versions write there.

The helper never deletes a table. A repeat run with a valid unified table verifies that source rows are already present exactly; it does not replace the unified table or discard later responses. Any future migration or cleanup requires a private backup and a separate, precise verification of existing answers. Do not put response exports or private backup files in this repository.

## Offline tests and fixtures

From the website directory, run:

```sh
npm test
npm run test:collector
```

`tests/backend.test.cjs` loads the actual release `UnifiedCollector.gs`. It checks its frozen hash, both independent version engines, 144 canonical/digest route combinations, 215-column projection, legacy-value preservation, missing versus zero, version-specific limits, hidden-answer cleanup, duplicate IDs, lock contention, literal/formula-safe writes, error receipts, and migration failure/retry cases. It uses mock services and makes no network requests.

`tests/review.test.mjs` retains the approved question/option/routing tests and verifies that `survey.json` and the full frontend logic match the embedded 2.3 engine. It also verifies the 215-column storage contract and the distinction between browser backup compatibility and collector version compatibility.

`testing/fixtures/original-2.2.gs.txt` and `original-2.3.gs.txt` are frozen historical test oracles, not deployable source files. Their `.txt` extension is intentional. `testing/qa/packet-*.json` contain synthetic answers for the tests only. None of these files contain real responses, credentials, or live receipts.
