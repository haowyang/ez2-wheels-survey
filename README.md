# eZ2 Wheels Student Survey — 2.4

Public questionnaire: https://haowyang.github.io/ez2-wheels-survey/

This release contains the complete 33-question survey. `config.json` connects it to the unified Google Apps Script collector. A response is submitted only when the Google confirmation page says it was saved.

## Questionnaire changes

- Both products use the same source-supported comparison headings: Pick-up, Return, and Charging. Product-specific details are preserved. Unspecified range, riding-area and rental-duration comparisons have been removed without inventing specifications.
- Q5 separates off-campus housing within walking distance from housing beyond walking distance.
- Q8 adds “I do not currently travel between locations on campus.” This option is exclusive: selecting it clears other modes; selecting another mode clears it. The collector rejects a conflicting combination. Its new binary export field is `V_Q8_9`.
- Q12 first separates never-use and only one or two lifetime rides. Respondents with more than two lifetime rides select their average monthly use over the past three months: less than one, one to less than four, or four or more. Codes 2–5 still trigger the experience questions.
- Q14 adds code 99, “Not enough experience to judge.” It is a missing analysis value with asked=1, not a low reliability score.
- Q6 retains the previously approved distance choices and NA rule. Q15 liking precedes Q16 interest. Q23–Q26 retain their non-overlapping response bands; Q26 is shown to all eligible respondents. A zero use, walking or budget response does not override Q16 pricing routes.

## Collection and export

There is one private **Responses** table and one **Codebook**. The collector accepts questionnaire versions 2.2, 2.3 and 2.4, validates each using its own frozen rules and preserves the original `survey_version` and answers.

The unified table has 217 columns. Its first 215 retain their prior names and positions; the new `V_Q8_9` and `V_Q8_9__asked` occupy columns 216 and 217. The table has seven metadata columns, 105 questionnaire value fields and 105 asked flags. The six legacy numeric fields remain available for 2.2 responses. Values are not converted between old numeric answers and newer band answers.

The 2.4 browser exports its own 99 questionnaire fields and 99 asked flags. Its backup CSV has 203 columns including five metadata fields. A 2.4 collector source record has 205 columns including seven metadata fields; the collector maps that record by field name into the 217-column unified table. `admin.html` merges local JSON files from this questionnaire version; it does not expose other respondents' data.

The six band fields contain category codes, not measured dollars, hours or minutes. Zero is substantive. Code 99 in Q6, Q14 and Q23–Q26 is retained in raw JSON but exported as blank with asked=1. Route-skipped and source-version-inapplicable fields are blank with asked=0. The response table stores analysis values and asked flags, not a separate raw-answers column.

Q5 and Q12 wording changed in 2.4, and Q14 gained an explicit uncertainty response. Interpret their values using `survey_version`; matching codes do not make different questionnaire wording identical. Q12 now has a fixed three-month reference period and a lifetime-trial category. Do not retrospectively assign that definition to 2.2 or 2.3 answers.

## Editing and testing

Edit `survey.json` together with the shared validation rules, collector engines and Codebook when changing question meanings or export fields. Keep private responses, Sheet IDs, backups and credentials out of this public repository. See the [collector instructions](google-sheets/README.md).

```sh
npm test
node serve.mjs
```

Tests cover every question's valid and invalid responses, requiredness, Other explanations, branch combinations, exclusivity, missing values, field mappings, and version-specific collector behavior. Local tests do not establish that a deployment succeeded; release verification checks the public site and actual receipt separately.
