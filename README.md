# eZ2 Wheels Student Survey — 2.3

Public questionnaire: https://haowyang.github.io/ez2-wheels-survey/

This release publishes the team's revised 33-question survey. `config.json` connects the site to the existing unified Google Apps Script collector. A response is submitted only after its Google confirmation page says it was saved.

## Changes

- The two offerings use matching headings: Pick-up, Return, Riding area, Range, Rental duration, and Charging. Known differences are preserved; unconfirmed product details are explicitly marked rather than invented.
- Q24 uses weekly actual riding-time bands, excluding time parked or merely keeping a vehicle.
- Q25 uses walking-time bands for one vehicle pick-up.
- Q26 uses monthly campus-travel budget bands and is shown to all eligible respondents.
- Q23 uses charging-payment bands with zero and Not sure options; Q2 permits university names up to 120 characters.
- Q6's existing choices and NA code 99 are unchanged. Q12 codes 2–5 count as previous experience; Never (1) skips Q13–Q14. Q15 liking precedes Q16 interest, and Q16 controls interest routing.

## Collection and export

There is one private **Responses** table and one **Codebook**. The unified collector accepts 2.2 and 2.3 packets, preserves the original `survey_version`, and stores 215 columns: seven metadata columns, 98 current answer fields with their 98 asked flags, plus six legacy numeric fields with their six asked flags. Historical numeric answers remain unchanged; they are never relabeled as band codes.

The six new band fields are `V_Q23_band`, `V_Q24_band_S`, `V_Q24_band_B`, `V_Q25_band_S`, `V_Q25_band_B`, and `V_Q26_band`. Their values are category codes, not measured dollars, hours, or minutes. Zero is substantive; 99 is explicit uncertainty (Q6: NA), exported as blank with asked=1. Skipped or version-inapplicable fields are blank with asked=0.

The browser backup contains only its own questionnaire version. Its CSV has 201 columns; the unified Google export has 215. `admin.html` is a local JSON-file merger for this version, not a portal to other respondents' answers. Export all collected answers from the private Google Sheet.

## Editing and testing

Edit question text/options in `survey.json`; keep coded values and field names stable unless the collector and Codebook are deliberately updated together. The collector rejects invalid fields and obsolete packet versions. See [collector instructions](google-sheets/README.md).

```sh
npm test
node serve.mjs
```

The automated tests cover every question's validation, branching, missing-value coding, and unified collection compatibility. Deployment verification also checks the public resources and actual browser-to-Sheets submission. Use clearly marked synthetic answers for testing, and remove only those exact rows after verification.

The product facts marked for confirmation remain limitations of the research concept. Range cut points are questionnaire design choices, not empirical estimates. Keep private responses, Sheet IDs, backups, and credentials out of this public repository.
