# eZ2 Wheels Student Survey — 3.1

Public questionnaire: https://haowyang.github.io/ez2-wheels-survey/

This release implements the teammate's 33-question 3.1 questionnaire. Respondent-facing wording, options and product prices match the supplied file. Two analysis notes were corrected: Q30's first compensation band includes zero, and Q24's combined weekly-use bands are categories, not a calculation of the cheapest plan for each vehicle.

## Routing and presentation

- Q1 screens for students age 18 or older at a large public university in the U.S.; No ends the survey.
- Q13 Yes shows experience questions Q14–Q16; No skips them.
- Everyone eligible rates liking in Q17 before interest in Q18. Q19 asks refusal reasons only for a product rated 1 in Q18.
- When both products have Q18=1, Q24–Q28 and Q31–Q32 are skipped. Q12's monthly campus budget remains available to all eligible respondents.
- Q24 asks one combined weekly-use question. Q25 and Q26 are shown only for products with Q18=2–5.
- Q26 has separate scooter and bike price tables. The three schemes share one randomized display order; None stays last. A scheme triggers Q27, while None triggers Q28, for that product only.
- Q29=1 skips Q30. All selected Other options show their required text fields; changing an upstream answer removes hidden answers.

Q3's Other option is single-choice. Q6 retains the previously approved choices and NA=99. The teammate removed the old Q8 no-travel option and the reliability uncertainty option; neither is silently restored. Response bands and 1–10 or 0–10 scales follow the 3.1 source exactly.

## Collection and historical compatibility

There is one private **Responses** tab and one **Codebook**. The collector validates 2.2, 2.3, 2.4 and 3.1 with separate engines. Existing response IDs, timestamps, source versions and values are preserved. The three historical engines remain unchanged.

The unified table has 413 columns: the original 217 columns followed by 196 new columns for 3.1 (98 values and 98 asked indicators). Every new physical field has a `v3_1__` prefix because question numbering and meanings changed. For example, a 3.1 answer using source field `V_Q13` is stored in `v3_1__V_Q13`. Do not combine fields solely because their source question numbers match.

New-version fields in historical rows are blank with asked=0. Historical fields in 3.1 rows are also blank with asked=0. Within a version, route-skipped fields have asked=0, while declared missing answers such as Q6=99 have a blank analysis value and asked=1. Category codes are not measured dollars, minutes or hours; use the Codebook's interval definitions.

The browser's JSON uses original 3.1 field names. Its local backup CSV has 201 columns (five metadata fields, 98 values and 98 asked flags). These backups are not submissions. `admin.html` checks and combines only matching-version local JSON files; it does not expose stored responses.

## Editing and verification

Update `survey.json`, shared routing, the current collector engine and Codebook together when question meanings change. Keep actual responses, private Sheet IDs, backups and credentials out of the public repository. See [collector instructions](google-sheets/README.md).

```sh
npm test
node serve.mjs
```

Tests cover every question, requiredness, Other fields, source fidelity, all eight teammate routing checks, pricing, export mappings and version-specific collection. Deployment verification additionally checks the published files and real browser submissions against the saved Sheet rows.
