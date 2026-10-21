# eZ2 Wheels Survey 2.2 — Pierre revision

The questionnaire wording and choices are taken from Pierre's survey (2).json. The user expressly chose to retain Q6's exact six choices (codes 1–5 and 99); no greater-than-5-miles option has been added.

## Data and routing

- Q6: raw JSON answers retain 99 = NA. The analysis value V_Q6 is blank in Google Sheets and CSV, while V_Q6__asked remains 1. A blank with asked=1 here is an explicit NA answer, not an unanswered required question. Codes 1–5 denote distance categories, not measured miles. Do not average these codes as distance.
- Q12: Never = 1 skips Q13–Q14; each valid answer 2, 3, 4, or 5 requires them. Missing or invalid values do not trigger experience questions. Changing back to Never clears previous Q13–Q14 answers and their Other text.
- Q4's age category meanings changed. Q6 now concerns on-campus residents; Q12 is no longer limited to commuting; Q26 now asks willingness to spend between locations on campus. Keep versions separate for analysis.
- Q15 liking and Q16 interest remain separate. Q16 governs interest routes. Q24 remains hours per week (0–168, up to two decimals).
- Q6 continues to be shown to everyone eligible, as Pierre specified. Off-campus residents select NA themselves. No new Q5-based routing or consistency restriction was added.

## Deployment and preservation

Use a separate v2.2 Apps Script deployment and Responses_v2_2 tab. Keep existing v2.0/v2.1 deployments and tables intact so already-open older questionnaires can still submit. The website's config.json must point only to the new v2.2 /exec URL. The spreadsheet ID and account credentials never belong in the public repository.

Version 2.2 uses versioned asset URLs. Refreshed pages use the new version and do not reinterpret a v2.1 draft under changed category meanings. Google Sheets Codebook_v2_2 documents all 98 questionnaire fields. Each value has a companion __asked flag, giving 203 total stored columns with metadata.

## Running and verifying

Use Node.js 18+; no packages are required. Run `node --test tests/logic.test.mjs tests/backend.test.cjs tests/pierre.test.mjs`, then `node serve.mjs` for local preview. Never publish synthetic test responses or private Google Sheets backups. Confirm a real public submission by matching its receipt with the private Sheet row, then remove only the identified synthetic rows.

For editing, survey.json controls wording/options. Changes to options, codes, units, or conditions require a new version, matching Schema.gs/Logic.gs, a separate collector version, and an updated codebook. Recompute exports through the current logic; never trust client-supplied flat/asked data.
