# eZ2 Wheels Student Survey — 3.3

Public questionnaire: https://haowyang.github.io/ez2-wheels-survey/

This release implements the latest teammate revision of the 33-question questionnaire. Q24 now has five combined weekly-use categories without a standalone zero choice. Q32 is a required 0–10 likelihood-to-recommend scale for every eligible student. Respondent-facing wording, options and product prices match the latest supplied file; its older version label is advanced to 3.3. Previously approved analysis corrections remain: Q30's first compensation band includes zero, and Q24's combined weekly-use categories cannot determine the cheapest plan for each vehicle.

## Routing and presentation

- Q1 screens for students age 18 or older at a large public university in the U.S.; No ends the survey.
- Q5=1 (On campus) shows required Q6. Q5=2 or 3 skips Q6 and clears any prior distance answer. Returning to On campus requires a new Q6 answer. Q6 accepts only its five supplied distance choices; no NA=99 option is present.
- Q13 Yes shows experience questions Q14–Q16; No skips them.
- Everyone eligible rates liking in Q17 before interest in Q18. Q19 asks refusal reasons only for a product rated 1 in Q18.
- When both products have Q18=1, Q24–Q28 are skipped. Q12's monthly campus budget, Q31's purchase likelihood, Q32's recommendation likelihood and Q33's optional comment remain available to all eligible respondents.
- Q24 asks one combined weekly-use question. Its codes are 1–5; the first choice is “Less than 15 minutes (or only occasionally)”, with the supplied interval [0, 15) minutes per week. Code 1 is a range category and does not identify an exact zero-use response. There is no code 0. Respondents who would ride less than weekly are asked to think about their average week.
- Q25 and Q26 are shown only for products with Q18=2–5. Q26 has separate scooter and bike price tables. The three schemes share one randomized display order; None stays last. A scheme triggers Q27, while None triggers Q28, for that product only.
- Q29=1 skips Q30. All selected Other options show their required text fields; changing an upstream answer removes hidden answers.
- Q32 asks “How likely are you to recommend eZ2 Wheels to a friend or classmate?” Valid ratings are the integers 0–10. Zero means “Not at all likely” and remains a valid observed answer with asked=1, even when neither product is interesting.

Q3's Other option is single-choice. Q6 retains the supplied distance ranges without adding a greater-than-5-mile category. Removed options are not silently restored. The hypothetical product descriptions, price tables and all other response scales remain as supplied.

## Collection and historical compatibility

There is one private **Responses** tab and one **Codebook**. The collector validates 2.2, 2.3, 2.4, 3.1, 3.2 and 3.3 using separate engines. Existing response IDs, timestamps, source versions and values are preserved. The five earlier engines remain unchanged.

The unified table stays at **413 columns**: the original 217 columns followed by 196 columns shared by 3.1, 3.2 and 3.3 (98 values and 98 asked indicators). These three versions use the existing `v3_1__` physical field prefix; `survey_version` distinguishes them. The prefix does not mean every row is version 3.1. Never relabel a historical row as 3.3 or reinterpret its codes using the latest questionnaire.

Interpret changed fields using each row's source version:

- In 3.1, Q6 was asked of every eligible student; raw NA=99 produced a blank analysis value with asked=1. In 3.2 and 3.3, Q6 is asked only when Q5=1, accepts only codes 1–5, and is blank with asked=0 for off-campus students.
- In 3.1, Q31 was asked only if at least one product was interesting (Q18=2–5). In 3.2 and 3.3, Q31 is required for every eligible student.
- In 3.1 and 3.2, Q24 had a separate zero-use code 0 and a strictly positive under-15-minutes code 1. In 3.3, code 0 is invalid and code 1 includes the supplied zero-to-under-15-minute range and occasional-use wording. Codes 2–5 retain their original boundaries. Preserve old zero-use answers; do not silently recode historical records as 3.3.
- In 3.1 and 3.2, Q32 was an interested-student-only single choice: 1=Yes, definitely; 2=Maybe; 3=No. In 3.3, it is a different question, a 0–10 likelihood scale for all eligible students. Old codes 1–3 are not 1–3 likelihood scores and cannot be converted to the new scale without an additional, explicitly justified analysis plan.

Fields that a version does not collect remain blank with asked=0. Route-skipped questions also have asked=0. The earlier 2.x fields and the `v3_1__` fields must not be combined solely because their source question numbers match. Band codes are not measured dollars, minutes or hours; use the Codebook's definitions and do not average category codes.

The browser's JSON uses the original source field names and schemaVersion 3.3. Its local backup CSV has 201 columns (five metadata fields, 98 values and 98 asked flags). These backups are not submissions. `admin.html` checks and combines only matching-version local JSON files; it does not expose stored responses.

## Editing and verification

Update `survey.json`, shared routing, the current collector engine and Codebook together when question meanings or audience change. Keep actual responses, private Sheet IDs, backups and credentials out of the public repository. See [collector instructions](google-sheets/README.md).

```sh
npm test
node serve.mjs
```

Tests cover all 33 questions, valid choices, requiredness, Other fields, malformed values, exact source fidelity, pricing, export mappings and version-specific collection. New acceptance cases verify Q24=1 with Q32=10 for an interested respondent, and a hidden Q24 with required valid Q32=0 for a respondent uninterested in both products. The former instructions to skip Q31 or Q32 for two uninterested products are superseded. Browser deployment checks use the current version and verify genuine submission receipts against saved Sheet rows.
