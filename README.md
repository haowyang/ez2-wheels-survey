# eZ2 Wheels Student Survey — 3.2

Public questionnaire: https://haowyang.github.io/ez2-wheels-survey/

This release implements the latest teammate revision of the 33-question questionnaire. It changes Q6 to on-campus students only and asks Q31 of every eligible student. Respondent-facing wording, options and product prices match the latest supplied file. The file's older version label is advanced to 3.2. Two previously approved analysis corrections remain: Q30's first compensation band includes zero, and Q24's combined weekly-use categories cannot determine the cheapest plan for each vehicle.

## Routing and presentation

- Q1 screens for students age 18 or older at a large public university in the U.S.; No ends the survey.
- Q5=1 (On campus) shows required Q6. Q5=2 or 3 skips Q6 and clears any prior distance answer. Returning to On campus requires a new Q6 answer. Q6 accepts only its five supplied distance choices; it has no NA=99 option in 3.2.
- Q13 Yes shows experience questions Q14–Q16; No skips them.
- Everyone eligible rates liking in Q17 before interest in Q18. Q19 asks refusal reasons only for a product rated 1 in Q18.
- When both products have Q18=1, Q24–Q28 and Q32 are skipped. Q12's monthly campus budget, Q31's purchase likelihood and Q33's optional comment remain available to all eligible respondents.
- Q24 asks one combined weekly-use question. Q25 and Q26 are shown only for products with Q18=2–5.
- Q26 has separate scooter and bike price tables. The three schemes share one randomized display order; None stays last. A scheme triggers Q27, while None triggers Q28, for that product only.
- Q29=1 skips Q30. All selected Other options show their required text fields; changing an upstream answer removes hidden answers.

Q3's Other option is single-choice. Q6 retains the supplied distance ranges without adding a greater-than-5-mile category. The removed Q8 no-travel and Q16 reliability uncertainty options are not restored. Response bands and scales follow the supplied source exactly.

## Collection and historical compatibility

There is one private **Responses** tab and one **Codebook**. The collector validates 2.2, 2.3, 2.4, 3.1 and 3.2 using separate engines. Existing response IDs, timestamps, source versions and values are preserved. The four earlier engines remain unchanged.

The unified table stays at **413 columns**: the original 217 columns followed by 196 columns shared by 3.1 and 3.2 (98 values and 98 asked indicators). Both versions use the existing `v3_1__` physical field prefix; `survey_version` distinguishes them. For example, source field `V_Q13` in either version is stored in `v3_1__V_Q13`. The prefix does not mean every row is version 3.1. Never relabel a historical row as 3.2.

Interpret the two changed routes using each row's source version:

- In 3.1, Q6 was asked of every eligible student; raw NA=99 produced a blank analysis value with asked=1. In 3.2, Q6 is asked only when Q5=1, accepts only codes 1–5, and is blank with asked=0 for off-campus students.
- In 3.1, Q31 was asked only if at least one product was interesting (Q18=2–5). In 3.2, Q31 is required for every eligible student, including students uninterested in both products.

Fields that a version does not collect remain blank with asked=0. Route-skipped questions also have asked=0. The earlier 2.x fields and the `v3_1__` fields must not be combined solely because their source question numbers match. Category codes are not measured dollars, minutes or hours; use the Codebook's definitions.

The browser's JSON uses the original source field names and schemaVersion 3.2. Its local backup CSV has 201 columns (five metadata fields, 98 values and 98 asked flags). These backups are not submissions. `admin.html` checks and combines only matching-version local JSON files; it does not expose stored responses.

## Editing and verification

Update `survey.json`, shared routing, the current collector engine and Codebook together when question meanings or audience change. Keep actual responses, private Sheet IDs, backups and credentials out of the public repository. See [collector instructions](google-sheets/README.md).

```sh
npm test
node serve.mjs
```

Tests cover all 33 questions, valid choices, requiredness, Other fields, malformed values, exact source fidelity, pricing, export mappings and version-specific collection. They include the latest Q5/Q6 transitions and all-eligible Q31 route; the earlier screenshot instruction to skip Q31 for two uninterested products is superseded. Browser deployment checks use the current version and verify genuine submission receipts against saved Sheet rows.
