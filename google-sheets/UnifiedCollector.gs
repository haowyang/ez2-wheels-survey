// Unified collector: paste this single file, replacing the entire old project source.
const SURVEY_ENGINES_=Object.freeze({
"2.2":(function(){
// Survey 2.2: Pierre revisions.
const SURVEY_SCHEMA = {
  "version": "2.2",
  "title": "eZ2 Wheels Student Survey",
  "intro": [
    "We are students conducting a market-research project for a company called Bikes N’ Spikes (BNS). Taking part is voluntary. There are no right or wrong answers.",
    "The questionnaire does not ask for your name, email address, or student ID.",
    "BNS plans to offer shared electric vehicles on university campuses under the name eZ2 Wheels: eZ2 S (electric scooters) and eZ2 B (electric bikes). You use the BNS app to unlock a vehicle, ride it, and leave it at the end of your trip; you do not buy the vehicle."
  ],
  "productIntro": [
    "eZ2 S — Electric scooters\nPick-up: Use the app to find and unlock the nearest available scooter anywhere on campus.\nDrop-off: The app shows where to leave it closest to your destination.\nRange: Typically 3–5 miles.\nCampus boundary: It locks automatically if you ride outside the campus boundary.\nCharging: Stations are located around campus.",
    "eZ2 B — Electric bikes\nPick-up: Take an e-bike from a designated bike stand.\nRide time: Ride for as long as you like, including for the day.\nReturn: Return it to any designated bike stand on campus.\nCharging: Stations are available."
  ],
  "pricingIntro": "The prices below are hypothetical scenarios for this survey. The same three pricing scenarios apply separately to eZ2 S (electric scooters) and eZ2 B (electric bikes). Please consider the plans for each offering you are interested in.",
  "plans": [
    {
      "value": 1,
      "label": "Scheme 1 – Pay per use",
      "description": "$12 per hour of riding, billed by the minute. No unlock fee. No commitment."
    },
    {
      "value": 2,
      "label": "Scheme 2 – Semester subscription",
      "description": "$120 flat per semester (about 16 weeks). Unlimited riding."
    },
    {
      "value": 3,
      "label": "Scheme 3 – Hybrid",
      "description": "$15 per month covers your first 3 hours of riding each month; each additional hour is $10, billed by the minute."
    }
  ],
  "sections": [
    {
      "id": "screening",
      "title": "Section 1 – Screener",
      "questions": [
        {
          "id": "Q1",
          "number": 1,
          "oldRef": "Q1",
          "variable": "V_Q1",
          "text": "Are you currently enrolled as a student at a large public university in the U.S.?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Yes"
            },
            {
              "value": 0,
              "label": "No"
            }
          ],
          "required": true,
          "condition": "always",
          "exportFields": [
            "V_Q1"
          ]
        },
        {
          "id": "Q2",
          "number": 2,
          "oldRef": "Q2",
          "variable": "V_Q2",
          "text": "Which university do you attend?",
          "type": "text",
          "options": [],
          "required": true,
          "condition": "eligible",
          "maxLength": 40,
          "exportFields": [
            "V_Q2"
          ]
        }
      ]
    },
    {
      "id": "background",
      "title": "Section 2 – About You",
      "questions": [
        {
          "id": "Q3",
          "number": 3,
          "oldRef": "Q3",
          "variable": "V_Q3",
          "text": "What is your current year in school?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "First-year"
            },
            {
              "value": 2,
              "label": "Sophomore"
            },
            {
              "value": 3,
              "label": "Junior"
            },
            {
              "value": 4,
              "label": "Senior"
            },
            {
              "value": 5,
              "label": "Graduate / professional"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q3"
          ]
        },
        {
          "id": "Q4",
          "number": 4,
          "oldRef": "Q4",
          "variable": "V_Q4",
          "text": "What is your age range?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "17 or younger"
            },
            {
              "value": 2,
              "label": "18-21"
            },
            {
              "value": 3,
              "label": "22-24"
            },
            {
              "value": 4,
              "label": "25-27"
            },
            {
              "value": 5,
              "label": "28-30"
            },
            {
              "value": 6,
              "label": "Above 30"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q4"
          ]
        },
        {
          "id": "Q5",
          "number": 5,
          "oldRef": "Q5",
          "variable": "V_Q5",
          "text": "Where do you live during the semester?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "On campus"
            },
            {
              "value": 2,
              "label": "Off campus, within walking distance of campus"
            },
            {
              "value": 3,
              "label": "Off campus, need to commute to campus"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q5"
          ]
        },
        {
          "id": "Q6",
          "number": 6,
          "oldRef": "Q6",
          "variable": "V_Q6",
          "text": "If you live on campus, how far is the typical distance to your classes? Choose NA if you do not live on campus.",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Less than 0.5 miles"
            },
            {
              "value": 2,
              "label": "0.5 to less than 1 mile"
            },
            {
              "value": 3,
              "label": "1 to less than 2 miles"
            },
            {
              "value": 4,
              "label": "2 to less than 3 miles"
            },
            {
              "value": 5,
              "label": "3–5 miles"
            },
            {
              "value": 99,
              "label": "NA"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q6"
          ],
          "missingValues": [
            99
          ]
        },
        {
          "id": "Q7",
          "number": 7,
          "oldRef": "Q7",
          "variable": "V_Q7",
          "text": "On how many days per week are you usually on campus?",
          "type": "number",
          "options": [],
          "required": true,
          "condition": "eligible",
          "min": 0,
          "max": 7,
          "decimals": 0,
          "exportFields": [
            "V_Q7"
          ]
        },
        {
          "id": "Q8",
          "number": 8,
          "oldRef": "Q8 (original variable V_Q10_1–V_Q10_8)",
          "variable": "V_Q8",
          "text": "How do you commute between locations on campus? (For example, from one class to the next, to purchase meals at the Student Center, or to visit the library/gym.) Select all that apply.",
          "type": "multi",
          "options": [
            {
              "value": 1,
              "label": "Walk"
            },
            {
              "value": 2,
              "label": "Own bike"
            },
            {
              "value": 3,
              "label": "Own scooter / skateboard"
            },
            {
              "value": 4,
              "label": "Car"
            },
            {
              "value": 5,
              "label": "Campus shuttle / bus"
            },
            {
              "value": 6,
              "label": "Rideshare"
            },
            {
              "value": 7,
              "label": "Shared scooter / bike service"
            },
            {
              "value": 8,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherField": "V_Q8_Other_txt"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q8_1",
            "V_Q8_2",
            "V_Q8_3",
            "V_Q8_4",
            "V_Q8_5",
            "V_Q8_6",
            "V_Q8_7",
            "V_Q8_8",
            "V_Q8_Other_txt"
          ]
        },
        {
          "id": "Q9",
          "number": 9,
          "oldRef": "Q9 (duplicate removed)",
          "variable": "V_Q9",
          "text": "Do you have regular access to a car?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Yes"
            },
            {
              "value": 0,
              "label": "No"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q9"
          ]
        },
        {
          "id": "Q10",
          "number": 10,
          "oldRef": "Unnumbered time-importance item (original V_Q11)",
          "variable": "V_Q10",
          "text": "How important is reducing travel time when moving between locations on campus?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Not at all important"
            },
            {
              "value": 2,
              "label": "Slightly important"
            },
            {
              "value": 3,
              "label": "Moderately important"
            },
            {
              "value": 4,
              "label": "Very important"
            },
            {
              "value": 5,
              "label": "Extremely important"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q10"
          ]
        },
        {
          "id": "Q11",
          "number": 11,
          "oldRef": "Unnumbered monthly-spending item (original V_Q11)",
          "variable": "V_Q11",
          "text": "Around how much do you spend on getting around every month (transit passes, rideshare, parking, gas, shared vehicles)?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "$0"
            },
            {
              "value": 2,
              "label": "More than $0 but less than $20"
            },
            {
              "value": 3,
              "label": "$20 to less than $50"
            },
            {
              "value": 4,
              "label": "$50 to less than $100"
            },
            {
              "value": 5,
              "label": "$100 to less than $150"
            },
            {
              "value": 6,
              "label": "$150 to less than $200"
            },
            {
              "value": 7,
              "label": "$200 or more"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q11"
          ]
        }
      ]
    },
    {
      "id": "experience",
      "title": "Section 3 – Getting Around Campus",
      "questions": [
        {
          "id": "Q12",
          "number": 12,
          "oldRef": "Q10 (shared-vehicle-use frequency)",
          "variable": "V_Q12",
          "text": "How often, if ever, do you use a shared e-scooter or e-bike?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Never"
            },
            {
              "value": 2,
              "label": "I have tried it once or twice, but don't use it regularly"
            },
            {
              "value": 3,
              "label": "Less than once a month"
            },
            {
              "value": 4,
              "label": "1–3 times a month"
            },
            {
              "value": 5,
              "label": "Once a week or more"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q12"
          ]
        },
        {
          "id": "Q13",
          "number": 13,
          "oldRef": "Unnumbered past-location item (original V_Q13)",
          "variable": "V_Q13",
          "text": "Where have you used it in the past? Select all that apply.",
          "type": "multi",
          "options": [
            {
              "value": 1,
              "label": "On my own campus"
            },
            {
              "value": 2,
              "label": "Another university campus"
            },
            {
              "value": 3,
              "label": "In a city (e.g., downtown, near my home)"
            },
            {
              "value": 4,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherField": "V_Q13_Other_txt"
            }
          ],
          "required": true,
          "condition": "experienced",
          "exportFields": [
            "V_Q13_1",
            "V_Q13_2",
            "V_Q13_3",
            "V_Q13_4",
            "V_Q13_Other_txt"
          ]
        },
        {
          "id": "Q14",
          "number": 14,
          "oldRef": "Unnumbered reliability item (original V_Q15)",
          "variable": "V_Q14",
          "text": "Based on your experience using shared vehicles, how reliable do you consider them for short-distance commuting?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Not at all reliable"
            },
            {
              "value": 2,
              "label": "Slightly reliable"
            },
            {
              "value": 3,
              "label": "Moderately reliable"
            },
            {
              "value": 4,
              "label": "Very reliable"
            },
            {
              "value": 5,
              "label": "Extremely reliable"
            }
          ],
          "required": true,
          "condition": "experienced",
          "exportFields": [
            "V_Q14"
          ]
        }
      ]
    },
    {
      "id": "interest",
      "title": "Section 4 – Interest in eZ2 Wheels",
      "questions": [
        {
          "id": "Q15",
          "number": 15,
          "oldRef": "Q17",
          "variable": "V_Q15",
          "text": "How much do you like each offering, considering both the product and how it works?",
          "type": "product_scale",
          "options": [
            {
              "value": 0,
              "label": "0 = Not at all"
            },
            {
              "value": 1,
              "label": "1"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = A great deal"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 0,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "help": "Choose one answer for each offering. 0 = Not at all; 10 = A great deal.",
          "exportFields": [
            "V_Q15_S",
            "V_Q15_B"
          ]
        },
        {
          "id": "Q16",
          "number": 16,
          "oldRef": "Q16",
          "variable": "V_Q16",
          "text": "How interested would you be in using each type of shared electric vehicle for commuting on campus?",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Not at all interested"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5 = Extremely interested"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 5,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "help": "Choose one answer for each offering. 1 = Not at all interested; 5 = Extremely interested.",
          "exportFields": [
            "V_Q16_S",
            "V_Q16_B"
          ]
        },
        {
          "id": "Q17",
          "number": 17,
          "oldRef": "Q18",
          "variable": "V_Q17",
          "text": "Since you selected that you are not interested, for each offering you are not interested in, select all the reasons that apply.",
          "type": "product_multi",
          "options": [
            {
              "value": 1,
              "label": "I do not need additional on-campus transportation."
            },
            {
              "value": 2,
              "label": "I prefer my current way of getting around."
            },
            {
              "value": 3,
              "label": "The service would not cover the trips I need."
            },
            {
              "value": 4,
              "label": "Weather would make this option unsuitable for me."
            },
            {
              "value": 5,
              "label": "Using a smartphone app would be difficult for me."
            },
            {
              "value": 6,
              "label": "I need more information about the service."
            },
            {
              "value": 7,
              "label": "Other reason (specify separately for each service)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherFields": {
                "S": "V_Q17_Other_txt_S",
                "B": "V_Q17_Other_txt_B"
              }
            }
          ],
          "required": true,
          "condition": "uninterested_S || uninterested_B",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "uninterested_S",
            "B": "uninterested_B"
          },
          "exportFields": [
            "V_Q17_1_S",
            "V_Q17_2_S",
            "V_Q17_3_S",
            "V_Q17_4_S",
            "V_Q17_5_S",
            "V_Q17_6_S",
            "V_Q17_7_S",
            "V_Q17_Other_txt_S",
            "V_Q17_1_B",
            "V_Q17_2_B",
            "V_Q17_3_B",
            "V_Q17_4_B",
            "V_Q17_5_B",
            "V_Q17_6_B",
            "V_Q17_7_B",
            "V_Q17_Other_txt_B"
          ]
        }
      ]
    },
    {
      "id": "attitudes",
      "title": "Section 5 – What You Think About Electric Bikes and Scooters",
      "description": "For the statements about safety, comfort, and pickup and return requirements, rate each offering separately on a scale of 1 to 10, where 1 = Strongly disagree and 10 = Strongly agree.",
      "questions": [
        {
          "id": "Q18",
          "number": 18,
          "oldRef": "Q19",
          "variable": "V_Q18",
          "text": "To what extent do you agree that electric bikes and scooters help reduce the environmental impact of transportation on campus?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Strongly disagree"
            },
            {
              "value": 2,
              "label": "Disagree"
            },
            {
              "value": 3,
              "label": "Neutral"
            },
            {
              "value": 4,
              "label": "Agree"
            },
            {
              "value": 5,
              "label": "Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q18"
          ]
        },
        {
          "id": "Q19",
          "number": 19,
          "oldRef": "Q20a",
          "variable": "V_Q19",
          "text": "I would feel safe using this transportation option.",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Strongly disagree"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "exportFields": [
            "V_Q19_S",
            "V_Q19_B"
          ]
        },
        {
          "id": "Q20",
          "number": 20,
          "oldRef": "Q20b",
          "variable": "V_Q20",
          "text": "I would be comfortable operating this type of vehicle.",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Strongly disagree"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "exportFields": [
            "V_Q20_S",
            "V_Q20_B"
          ]
        },
        {
          "id": "Q21",
          "number": 21,
          "oldRef": "Q20c",
          "variable": "V_Q21",
          "text": "The pickup and return requirements would be convenient for me.",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Strongly disagree"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "exportFields": [
            "V_Q21_S",
            "V_Q21_B"
          ]
        }
      ]
    },
    {
      "id": "charger",
      "title": "Section 6 – Charger Program",
      "description": "BNS also plans to add a separate “charger” version of the app. Students can earn money by charging eZ2 vehicles at charging stations so they are ready for riders.",
      "questions": [
        {
          "id": "Q22",
          "number": 22,
          "oldRef": "Q21",
          "variable": "V_Q22",
          "text": "How interested, if at all, would you be in charging shared electric vehicles in exchange for compensation?",
          "type": "scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Not at all interested"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5 = Extremely interested"
            }
          ],
          "required": true,
          "condition": "eligible",
          "min": 1,
          "max": 5,
          "decimals": 0,
          "exportFields": [
            "V_Q22"
          ]
        },
        {
          "id": "Q23",
          "number": 23,
          "oldRef": "Q22",
          "variable": "V_Q23",
          "text": "What is the minimum compensation per vehicle charged that would make you consider participating in this activity?",
          "type": "number",
          "options": [],
          "required": true,
          "condition": "charger_interest",
          "min": 0,
          "decimals": 2,
          "help": "Enter a dollar amount per vehicle charged.",
          "exportFields": [
            "V_Q23"
          ]
        }
      ]
    },
    {
      "id": "expected_use",
      "title": "Section 7 – Expected Use",
      "questions": [
        {
          "id": "Q24",
          "number": 24,
          "oldRef": "Q23",
          "variable": "V_Q24",
          "text": "About how many total hours would you expect to use each offering in a typical week?",
          "type": "product_number",
          "options": [],
          "required": true,
          "condition": "any_interest",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "interested_S",
            "B": "interested_B"
          },
          "min": 0,
          "decimals": 2,
          "help": "Enter hours per week (for example, 0.5 for 30 minutes). Enter 0 if you would not use it.",
          "exportFields": [
            "V_Q24_S",
            "V_Q24_B"
          ],
          "max": 168
        },
        {
          "id": "Q25",
          "number": 25,
          "oldRef": "Q24",
          "variable": "V_Q25",
          "text": "What is the maximum amount of time (in minutes) you would be willing to walk to access an available electric bike or electric scooter on campus?",
          "type": "product_number",
          "options": [],
          "required": true,
          "condition": "any_interest",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "interested_S",
            "B": "interested_B"
          },
          "min": 0,
          "decimals": 0,
          "help": "Enter minutes separately for each offering shown.",
          "exportFields": [
            "V_Q25_S",
            "V_Q25_B"
          ]
        },
        {
          "id": "Q26",
          "number": 26,
          "oldRef": "Q25",
          "variable": "V_Q26",
          "text": "What is the maximum amount per month you would be willing to spend on getting between locations on campus (not including travel to and from campus)?",
          "type": "number",
          "options": [],
          "required": true,
          "condition": "any_interest",
          "min": 0,
          "decimals": 2,
          "help": "Enter a dollar amount per month.",
          "exportFields": [
            "V_Q26"
          ]
        }
      ]
    },
    {
      "id": "pricing",
      "title": "Section 8 – Pricing Preferences",
      "questions": [
        {
          "id": "Q27",
          "number": 27,
          "oldRef": "Q26",
          "variable": "V_Q27",
          "text": "For each offering, which ONE pricing scheme would you prefer?",
          "type": "product_single",
          "options": [
            {
              "value": 1,
              "label": "Scheme 1 – Pay per use"
            },
            {
              "value": 2,
              "label": "Scheme 2 – Semester subscription"
            },
            {
              "value": 3,
              "label": "Scheme 3 – Hybrid"
            },
            {
              "value": 4,
              "label": "None of these (would not choose any)"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "interested_S",
            "B": "interested_B"
          },
          "exportFields": [
            "V_Q27_S",
            "V_Q27_B"
          ]
        },
        {
          "id": "Q28",
          "number": 28,
          "oldRef": "Q27",
          "variable": "V_Q28",
          "text": "Why did you choose that scheme? Select all that apply for each offering shown.",
          "type": "product_multi",
          "options": [
            {
              "value": 1,
              "label": "Lowest total cost for how much I would ride"
            },
            {
              "value": 2,
              "label": "Flexibility – only pay when I ride"
            },
            {
              "value": 3,
              "label": "No commitment"
            },
            {
              "value": 4,
              "label": "Easy to understand"
            },
            {
              "value": 5,
              "label": "Predictable monthly/semester cost"
            },
            {
              "value": 6,
              "label": "Best fit for how often I would ride"
            },
            {
              "value": 7,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherFields": {
                "S": "V_Q28_Other_txt_S",
                "B": "V_Q28_Other_txt_B"
              }
            }
          ],
          "required": true,
          "condition": "chose_plan_S || chose_plan_B",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "chose_plan_S",
            "B": "chose_plan_B"
          },
          "exportFields": [
            "V_Q28_1_S",
            "V_Q28_2_S",
            "V_Q28_3_S",
            "V_Q28_4_S",
            "V_Q28_5_S",
            "V_Q28_6_S",
            "V_Q28_7_S",
            "V_Q28_Other_txt_S",
            "V_Q28_1_B",
            "V_Q28_2_B",
            "V_Q28_3_B",
            "V_Q28_4_B",
            "V_Q28_5_B",
            "V_Q28_6_B",
            "V_Q28_7_B",
            "V_Q28_Other_txt_B"
          ]
        },
        {
          "id": "Q29",
          "number": 29,
          "oldRef": "Q28",
          "variable": "V_Q29",
          "text": "Why would you not choose any of the schemes? Select all that apply for each offering shown.",
          "type": "product_multi",
          "options": [
            {
              "value": 1,
              "label": "Too expensive overall"
            },
            {
              "value": 2,
              "label": "I would not ride enough to justify any of them"
            },
            {
              "value": 3,
              "label": "I would want a different kind of plan (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please describe the kind of plan you would want.",
              "otherFields": {
                "S": "V_Q29_DifferentPlan_txt_S",
                "B": "V_Q29_DifferentPlan_txt_B"
              }
            },
            {
              "value": 4,
              "label": "Plans are confusing"
            },
            {
              "value": 5,
              "label": "I would only use it occasionally and want a free/very cheap option"
            },
            {
              "value": 6,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherFields": {
                "S": "V_Q29_Other_txt_S",
                "B": "V_Q29_Other_txt_B"
              }
            }
          ],
          "required": true,
          "condition": "chose_none_S || chose_none_B",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "chose_none_S",
            "B": "chose_none_B"
          },
          "exportFields": [
            "V_Q29_1_S",
            "V_Q29_2_S",
            "V_Q29_3_S",
            "V_Q29_4_S",
            "V_Q29_5_S",
            "V_Q29_6_S",
            "V_Q29_DifferentPlan_txt_S",
            "V_Q29_Other_txt_S",
            "V_Q29_1_B",
            "V_Q29_2_B",
            "V_Q29_3_B",
            "V_Q29_4_B",
            "V_Q29_5_B",
            "V_Q29_6_B",
            "V_Q29_DifferentPlan_txt_B",
            "V_Q29_Other_txt_B"
          ]
        }
      ]
    },
    {
      "id": "beyond",
      "title": "Section 9 – Beyond Campus and Final Comment",
      "description": "BNS hopes to later sell these vehicles to the public.",
      "questions": [
        {
          "id": "Q30",
          "number": 30,
          "oldRef": "Q29",
          "variable": "V_Q30",
          "text": "If eZ2 S or eZ2 B were available to the general public off campus (rent in your city), how likely would you be to use it?",
          "type": "scale",
          "options": [
            {
              "value": 0,
              "label": "0 = Not at all likely"
            },
            {
              "value": 1,
              "label": "1"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Extremely likely"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "min": 0,
          "max": 10,
          "decimals": 0,
          "exportFields": [
            "V_Q30"
          ]
        },
        {
          "id": "Q31",
          "number": 31,
          "oldRef": "Q30",
          "variable": "V_Q31",
          "text": "If you could buy (instead of renting) an eZ2 vehicle of your own for use off campus, how likely would you be to buy one?",
          "type": "scale",
          "options": [
            {
              "value": 0,
              "label": "0 = Not at all likely"
            },
            {
              "value": 1,
              "label": "1"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Extremely likely"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "min": 0,
          "max": 10,
          "decimals": 0,
          "exportFields": [
            "V_Q31"
          ]
        },
        {
          "id": "Q32",
          "number": 32,
          "oldRef": "Q31",
          "variable": "V_Q32",
          "text": "Would you tell friends or family about eZ2 Wheels, share it on social media, or otherwise recommend it?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Yes, definitely"
            },
            {
              "value": 2,
              "label": "Maybe"
            },
            {
              "value": 3,
              "label": "No"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "exportFields": [
            "V_Q32"
          ]
        },
        {
          "id": "Q33",
          "number": 33,
          "oldRef": "Q32 (Q33 in the original drafting note)",
          "variable": "V_Q33",
          "text": "Anything else you would like to tell BNS?",
          "type": "text",
          "options": [],
          "required": false,
          "condition": "eligible",
          "maxLength": 100,
          "help": "Optional.",
          "exportFields": [
            "V_Q33"
          ]
        }
      ]
    }
  ]
};


// Survey 2.2: Q6 NA is analysis missing; experienced means Q12 codes 2–5.
/* Pure survey rules shared by the browser, exports and Node tests. No browser APIs. */
const PRODUCT_NAMES = {S:'Electric scooter (eZ2 S)',B:'Electric bike (eZ2 B)'};
const allQuestions = schema => schema.sections.flatMap(section => section.questions);
const keyFor = (q, product) => product ? `${q.id}_${product}` : q.id;
const otherKey = (key, option) => `${key}__${option.value}_text`;
const hasValue = value => value !== undefined && value !== null && value !== '';
const same = (a,b) => String(a) === String(b);
function conditionMet(condition, answers) {
  if (condition?.includes('||')) return condition.split('||').some(part=>conditionMet(part.trim(),answers));
  const eligible = same(answers.Q1, 1);
  const interest = p => Number(answers[`Q16_${p}`]) >= 2 && Number(answers[`Q16_${p}`]) <= 5;
  if (!condition || condition === 'always') return true;
  if (condition === 'eligible') return eligible;
  if (!eligible) return false;
  if (condition === 'experienced') return ['number','string'].includes(typeof answers.Q12) && [2,3,4,5].some(value => same(answers.Q12, value));
  if (condition === 'any_interest') return interest('S') || interest('B');
  if (condition === 'charger_interest') return Number(answers.Q22) >= 2 && Number(answers.Q22) <= 5;
  const [_, p] = condition.match(/_([SB])$/) || [];
  if (condition.startsWith('uninterested_')) return same(answers[`Q16_${p}`], 1);
  if (condition.startsWith('interested_')) return interest(p);
  if (condition.startsWith('chose_plan_')) return interest(p) && [1,2,3].includes(Number(answers[`Q27_${p}`]));
  if (condition.startsWith('chose_none_')) return interest(p) && same(answers[`Q27_${p}`], 4);
  throw new Error(`Unknown condition: ${condition}`);
}
function visibleProducts(q, answers) {
  return (q.products || ['S','B']).filter(p => conditionMet(q.productConditions?.[p] || q.condition, answers));
}
function isVisible(q, answers) {
  return conditionMet(q.condition, answers) && (!q.type.startsWith('product_') || visibleProducts(q, answers).length > 0);
}
function expandedQuestions(schema, answers) {
  return allQuestions(schema).flatMap(q => {
    if (!isVisible(q, answers)) return [];
    return q.type.startsWith('product_')
      ? visibleProducts(q, answers).map(product => ({q, product, key:keyFor(q, product)}))
      : [{q, product:null, key:q.id}];
  });
}
function cleanAnswers(schema, answers) {
  // Iterate until changes to an upstream answer have removed every hidden descendant.
  let result = {...answers};
  for (let iteration=0; iteration<4; iteration++) {
    const cleaned = {};
    for (const {q,key} of expandedQuestions(schema,result)) {
      if (Object.prototype.hasOwnProperty.call(result,key)) cleaned[key] = result[key];
      for (const option of q.options || []) {
        const selected = Array.isArray(result[key]) ? result[key].some(v => same(v, option.value)) : same(result[key],option.value);
        const detailKey = otherKey(key,option);
        if (option.other && selected && Object.prototype.hasOwnProperty.call(result,detailKey)) cleaned[detailKey] = result[detailKey];
      }
    }
    if (JSON.stringify(result) === JSON.stringify(cleaned)) return cleaned;
    result = cleaned;
  }
  return result;
}
function validateItem(q,key,answers) {
  const errors=[];
  const value=answers[key];
  const type=q.type.replace('product_','');
  const empty=!hasValue(value) || (type==='multi' && Array.isArray(value) && value.length===0);
  if (empty) return q.required ? [{key,message:'Please answer this question.'}] : [];
  if (type==='single' || type==='multi') {
    const options=(q.options || []).map(o=>String(o.value));
    const selected=type==='multi' ? value : [value];
    if (!Array.isArray(selected) || selected.some(v=>!['number','string'].includes(typeof v)||!options.includes(String(v))) || (type==='multi' && new Set(selected.map(String)).size!==selected.length)) {
      errors.push({key,message:'Please select a valid answer.'});
    }
  }
  if (type==='number' || type==='scale') {
    const number=typeof value==='number' ? value : Number(String(value).trim());
    if (!['number','string'].includes(typeof value) || (typeof value==='string' && !/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) || !Number.isFinite(number)) errors.push({key,message:'Please enter a valid number.'});
    else if (q.min!==undefined && number<q.min) errors.push({key,message:`Enter a number of at least ${q.min}.`});
    else if (q.max!==undefined && number>q.max) errors.push({key,message:`Enter a number no greater than ${q.max}.`});
    else if ((type==='scale' || q.decimals===0) && !Number.isInteger(number)) errors.push({key,message:'Please enter a whole number.'});
    else if (q.decimals!==undefined && Math.abs(number*10**q.decimals-Math.round(number*10**q.decimals))>1e-7) errors.push({key,message:`Use no more than ${q.decimals} decimal place${q.decimals===1?'':'s'}.`});
  }
  if (type==='text') {
    if (typeof value!=='string') errors.push({key,message:'Please enter text.'});
    else if (!value.trim() && q.required) errors.push({key,message:'Please enter an answer.'});
    else if (q.maxLength && value.length>q.maxLength) errors.push({key,message:`Use ${q.maxLength} characters or fewer.`});
  }
  for (const option of q.options || []) {
    const selected=Array.isArray(value) ? value.some(v=>same(v,option.value)) : same(value,option.value);
    if (!option.other || !selected) continue;
    const detailKey=otherKey(key,option), text=answers[detailKey];
    if (option.otherRequired && (typeof text!=='string' || !text.trim())) errors.push({key:detailKey,message:'Please specify your answer.'});
    else if (hasValue(text) && (typeof text!=='string' || (option.otherMaxLength && text.length>option.otherMaxLength))) errors.push({key:detailKey,message:`Use ${option.otherMaxLength || 100} characters or fewer.`});
  }
  return errors;
}
function validateAll(schema,answers) {
  const cleaned=cleanAnswers(schema,answers);
  return expandedQuestions(schema,cleaned).flatMap(({q,key})=>validateItem(q,key,cleaned));
}
function shuffledPlans(rng=Math.random) {
  const result=[1,2,3];
  for (let i=result.length-1;i>0;i--) {const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
function orderedOptions(q,planOrder) {
  if (q.id!=='Q27') return q.options || [];
  const options=q.options || [];
  return [...planOrder.map(value=>options.find(o=>same(o.value,value))).filter(Boolean),...options.filter(o=>!planOrder.some(v=>same(v,o.value)))];
}
function normalizedValue(q,value) {
  if (!hasValue(value)) return '';
  // Keep declared NA codes in raw answers, but exclude them from analysis values.
  if ((q.missingValues || []).some(code => same(code,value))) return '';
  const type=q.type.replace('product_','');
  if (type==='number' || type==='scale') return Number(value);
  if (type==='text') return String(value).trim();
  if (type==='single') return (q.options || []).find(o=>same(o.value,value))?.value ?? value;
  return value;
}
function makeRecord(schema,input,metadata) {
  const errors=validateAll(schema,input);
  if (errors.length) throw new Error(`The response has ${errors.length} unanswered or invalid field(s).`);
  const answers=cleanAnswers(schema,input), asked={}, flat={};
  const visible=new Set(expandedQuestions(schema,answers).map(item=>item.key));
  for (const q of allQuestions(schema)) {
    const products=q.type.startsWith('product_') ? q.products || ['S','B'] : [null];
    for (const product of products) {
      const key=keyFor(q,product), wasAsked=visible.has(key), suffix=product?`_${product}`:'', base=q.variable || `V_${q.id}`;
      asked[key]=wasAsked;
      const type=q.type.replace('product_',''), value=answers[key];
      if (type==='multi') {
        for (const option of q.options || []) {
          const field=`${base}_${option.value}${suffix}`;
          flat[field]=wasAsked && hasValue(value) ? (value.some(v=>same(v,option.value))?1:0) : '';
          flat[`${field}__asked`]=wasAsked?1:0;
        }
      } else {
        const field=`${base}${suffix}`;
        flat[field]=wasAsked?normalizedValue(q,value):'';
        flat[`${field}__asked`]=wasAsked?1:0;
      }
      for (const option of q.options || []) {
        if (!option.other) continue;
        const field=product ? option.otherFields?.[product] : option.otherField;
        const name=field || `${base}_Other_txt${suffix}`;
        const selected=wasAsked && (Array.isArray(value)?value.some(v=>same(v,option.value)):same(value,option.value));
        flat[name]=selected?String(answers[otherKey(key,option)] || '').trim():'';
        flat[`${name}__asked`]=selected?1:0;
        asked[otherKey(key,option)]=selected;
      }
    }
  }
  return {schemaVersion:schema.version,surveyTitle:schema.title,responseId:metadata.responseId,startedAt:metadata.startedAt,completedAt:metadata.completedAt,planOrder:metadata.planOrder,answers,asked,flat};
}
function csvCell(value) {
  let text=value===null || value===undefined?'':String(value);
  // Preserve numeric values while preventing spreadsheet formula execution in text.
  if (typeof value==='string' && /^[=+\-@\t\r]/.test(text)) text=`'${text}`;
  return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}
function recordsToCsv(records) {
  if (!records.length) return '';
  const fields=[...new Set(records.flatMap(record=>Object.keys(record.flat)))];
  const meta=['response_id','schema_version','started_at','completed_at','plan_order'];
  const lines=[[...meta,...fields].map(csvCell).join(',')];
  for (const r of records) lines.push([r.responseId,r.schemaVersion,r.startedAt,r.completedAt,(r.planOrder||[]).join('|'),...fields.map(field=>r.flat[field]??'')].map(csvCell).join(','));
  return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
function verifyImportedRecord(schema,record) {
  if (!record || record.schemaVersion!==schema.version) throw new Error('Survey version does not match.');
  if (typeof record.responseId!=='string' || !/^[a-zA-Z0-9-]{8,80}$/.test(record.responseId)) throw new Error('Missing or invalid response ID.');
  if (!record.answers || typeof record.answers!=='object' || Array.isArray(record.answers)) throw new Error('Missing response answers.');
  if (!same(record.answers.Q1,1)) throw new Error('This is not an eligible completed response.');
  if (!Array.isArray(record.planOrder) || record.planOrder.map(Number).sort().join(',')!=='1,2,3') throw new Error('Invalid plan order.');
  if (!Number.isFinite(Date.parse(record.startedAt)) || !Number.isFinite(Date.parse(record.completedAt))) throw new Error('Invalid response dates.');
  // Recompute all export data; imported flat/asked values are not trusted.
  return makeRecord(schema,record.answers,record);
}



return Object.freeze({schema:SURVEY_SCHEMA,cleanAnswers:cleanAnswers,validateAll:validateAll,makeRecord:makeRecord});
})(),
"2.3":(function(){
// Review draft 2.3: not deployed.
const SURVEY_SCHEMA = {
  "version": "2.3",
  "title": "eZ2 Wheels Student Survey",
  "intro": [
    "We are students conducting a market-research project for a company called Bikes N’ Spikes (BNS). Taking part is voluntary. There are no right or wrong answers.",
    "The questionnaire does not ask for your name, email address, or student ID.",
    "BNS plans to offer shared electric vehicles on university campuses under the name eZ2 Wheels: eZ2 S (electric scooters) and eZ2 B (electric bikes). You use the BNS app to unlock a vehicle, ride it, and leave it at the end of your trip; you do not buy the vehicle."
  ],
  "productIntro": [
    "eZ2 S — Electric scooters\nPick-up: Use the app to find and unlock the nearest available scooter anywhere on campus.\nReturn: The app shows where to leave it closest to your destination.\nRiding area: Campus use. The current draft says it locks outside the campus boundary; how this works needs confirmation.\nRange: To be confirmed. The current draft says “3–5 miles”; its meaning needs clarification.\nRental duration: To be confirmed.\nCharging: Stations are located around campus.",
    "eZ2 B — Electric bikes\nPick-up: Take an e-bike from a designated bike stand on campus.\nReturn: Return it to any designated bike stand on campus.\nRiding area: Whether riding outside campus is allowed is to be confirmed.\nRange: To be confirmed.\nRental duration: As currently described, ride for as long as you like, including for the day.\nCharging: Stations are available."
  ],
  "pricingIntro": "The prices below are hypothetical scenarios for this survey. The same three pricing scenarios apply separately to eZ2 S (electric scooters) and eZ2 B (electric bikes). Please consider the plans for each offering you are interested in.",
  "plans": [
    {
      "value": 1,
      "label": "Scheme 1 – Pay per use",
      "description": "$12 per hour of riding, billed by the minute. No unlock fee. No commitment."
    },
    {
      "value": 2,
      "label": "Scheme 2 – Semester subscription",
      "description": "$120 flat per semester (about 16 weeks). Unlimited riding."
    },
    {
      "value": 3,
      "label": "Scheme 3 – Hybrid",
      "description": "$15 per month covers your first 3 hours of riding each month; each additional hour is $10, billed by the minute."
    }
  ],
  "sections": [
    {
      "id": "screening",
      "title": "Section 1 – Screener",
      "questions": [
        {
          "id": "Q1",
          "number": 1,
          "oldRef": "Q1",
          "variable": "V_Q1",
          "text": "Are you currently enrolled as a student at a large public university in the U.S.?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Yes"
            },
            {
              "value": 0,
              "label": "No"
            }
          ],
          "required": true,
          "condition": "always",
          "exportFields": [
            "V_Q1"
          ]
        },
        {
          "id": "Q2",
          "number": 2,
          "oldRef": "Q2",
          "variable": "V_Q2",
          "text": "Which university do you attend?",
          "type": "text",
          "options": [],
          "required": true,
          "condition": "eligible",
          "maxLength": 120,
          "exportFields": [
            "V_Q2"
          ]
        }
      ]
    },
    {
      "id": "background",
      "title": "Section 2 – About You",
      "questions": [
        {
          "id": "Q3",
          "number": 3,
          "oldRef": "Q3",
          "variable": "V_Q3",
          "text": "What is your current year in school?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "First-year"
            },
            {
              "value": 2,
              "label": "Sophomore"
            },
            {
              "value": 3,
              "label": "Junior"
            },
            {
              "value": 4,
              "label": "Senior"
            },
            {
              "value": 5,
              "label": "Graduate / professional"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q3"
          ]
        },
        {
          "id": "Q4",
          "number": 4,
          "oldRef": "Q4",
          "variable": "V_Q4",
          "text": "What is your age range?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "17 or younger"
            },
            {
              "value": 2,
              "label": "18-21"
            },
            {
              "value": 3,
              "label": "22-24"
            },
            {
              "value": 4,
              "label": "25-27"
            },
            {
              "value": 5,
              "label": "28-30"
            },
            {
              "value": 6,
              "label": "Above 30"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q4"
          ]
        },
        {
          "id": "Q5",
          "number": 5,
          "oldRef": "Q5",
          "variable": "V_Q5",
          "text": "Where do you live during the semester?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "On campus"
            },
            {
              "value": 2,
              "label": "Off campus, within walking distance of campus"
            },
            {
              "value": 3,
              "label": "Off campus, need to commute to campus"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q5"
          ]
        },
        {
          "id": "Q6",
          "number": 6,
          "oldRef": "Q6",
          "variable": "V_Q6",
          "text": "If you live on campus, how far is the typical distance to your classes? Choose NA if you do not live on campus.",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Less than 0.5 miles"
            },
            {
              "value": 2,
              "label": "0.5 to less than 1 mile"
            },
            {
              "value": 3,
              "label": "1 to less than 2 miles"
            },
            {
              "value": 4,
              "label": "2 to less than 3 miles"
            },
            {
              "value": 5,
              "label": "3–5 miles"
            },
            {
              "value": 99,
              "label": "NA"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q6"
          ],
          "missingValues": [
            99
          ]
        },
        {
          "id": "Q7",
          "number": 7,
          "oldRef": "Q7",
          "variable": "V_Q7",
          "text": "On how many days per week are you usually on campus?",
          "type": "number",
          "options": [],
          "required": true,
          "condition": "eligible",
          "min": 0,
          "max": 7,
          "decimals": 0,
          "exportFields": [
            "V_Q7"
          ]
        },
        {
          "id": "Q8",
          "number": 8,
          "oldRef": "Q8 (original variable V_Q10_1–V_Q10_8)",
          "variable": "V_Q8",
          "text": "How do you commute between locations on campus? (For example, from one class to the next, to purchase meals at the Student Center, or to visit the library/gym.) Select all that apply.",
          "type": "multi",
          "options": [
            {
              "value": 1,
              "label": "Walk"
            },
            {
              "value": 2,
              "label": "Own bike"
            },
            {
              "value": 3,
              "label": "Own scooter / skateboard"
            },
            {
              "value": 4,
              "label": "Car"
            },
            {
              "value": 5,
              "label": "Campus shuttle / bus"
            },
            {
              "value": 6,
              "label": "Rideshare"
            },
            {
              "value": 7,
              "label": "Shared scooter / bike service"
            },
            {
              "value": 8,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherField": "V_Q8_Other_txt"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q8_1",
            "V_Q8_2",
            "V_Q8_3",
            "V_Q8_4",
            "V_Q8_5",
            "V_Q8_6",
            "V_Q8_7",
            "V_Q8_8",
            "V_Q8_Other_txt"
          ]
        },
        {
          "id": "Q9",
          "number": 9,
          "oldRef": "Q9 (duplicate removed)",
          "variable": "V_Q9",
          "text": "Do you have regular access to a car?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Yes"
            },
            {
              "value": 0,
              "label": "No"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q9"
          ]
        },
        {
          "id": "Q10",
          "number": 10,
          "oldRef": "Unnumbered time-importance item (original V_Q11)",
          "variable": "V_Q10",
          "text": "How important is reducing travel time when moving between locations on campus?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Not at all important"
            },
            {
              "value": 2,
              "label": "Slightly important"
            },
            {
              "value": 3,
              "label": "Moderately important"
            },
            {
              "value": 4,
              "label": "Very important"
            },
            {
              "value": 5,
              "label": "Extremely important"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q10"
          ]
        },
        {
          "id": "Q11",
          "number": 11,
          "oldRef": "Unnumbered monthly-spending item (original V_Q11)",
          "variable": "V_Q11",
          "text": "Around how much do you spend on getting around every month (transit passes, rideshare, parking, gas, shared vehicles)?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "$0"
            },
            {
              "value": 2,
              "label": "More than $0 but less than $20"
            },
            {
              "value": 3,
              "label": "$20 to less than $50"
            },
            {
              "value": 4,
              "label": "$50 to less than $100"
            },
            {
              "value": 5,
              "label": "$100 to less than $150"
            },
            {
              "value": 6,
              "label": "$150 to less than $200"
            },
            {
              "value": 7,
              "label": "$200 or more"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q11"
          ]
        }
      ]
    },
    {
      "id": "experience",
      "title": "Section 3 – Getting Around Campus",
      "questions": [
        {
          "id": "Q12",
          "number": 12,
          "oldRef": "Q10 (shared-vehicle-use frequency)",
          "variable": "V_Q12",
          "text": "How often, if ever, do you use a shared e-scooter or e-bike?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Never"
            },
            {
              "value": 2,
              "label": "I have tried it once or twice, but don't use it regularly"
            },
            {
              "value": 3,
              "label": "Less than once a month"
            },
            {
              "value": 4,
              "label": "1–3 times a month"
            },
            {
              "value": 5,
              "label": "Once a week or more"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q12"
          ]
        },
        {
          "id": "Q13",
          "number": 13,
          "oldRef": "Unnumbered past-location item (original V_Q13)",
          "variable": "V_Q13",
          "text": "Where have you used it in the past? Select all that apply.",
          "type": "multi",
          "options": [
            {
              "value": 1,
              "label": "On my own campus"
            },
            {
              "value": 2,
              "label": "Another university campus"
            },
            {
              "value": 3,
              "label": "In a city (e.g., downtown, near my home)"
            },
            {
              "value": 4,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherField": "V_Q13_Other_txt"
            }
          ],
          "required": true,
          "condition": "experienced",
          "exportFields": [
            "V_Q13_1",
            "V_Q13_2",
            "V_Q13_3",
            "V_Q13_4",
            "V_Q13_Other_txt"
          ]
        },
        {
          "id": "Q14",
          "number": 14,
          "oldRef": "Unnumbered reliability item (original V_Q15)",
          "variable": "V_Q14",
          "text": "Based on your experience using shared vehicles, how reliable do you consider them for short-distance commuting?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Not at all reliable"
            },
            {
              "value": 2,
              "label": "Slightly reliable"
            },
            {
              "value": 3,
              "label": "Moderately reliable"
            },
            {
              "value": 4,
              "label": "Very reliable"
            },
            {
              "value": 5,
              "label": "Extremely reliable"
            }
          ],
          "required": true,
          "condition": "experienced",
          "exportFields": [
            "V_Q14"
          ]
        }
      ]
    },
    {
      "id": "interest",
      "title": "Section 4 – Interest in eZ2 Wheels",
      "questions": [
        {
          "id": "Q15",
          "number": 15,
          "oldRef": "Q17",
          "variable": "V_Q15",
          "text": "How much do you like each offering, considering both the product and how it works?",
          "type": "product_scale",
          "options": [
            {
              "value": 0,
              "label": "0 = Not at all"
            },
            {
              "value": 1,
              "label": "1"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = A great deal"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 0,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "help": "Choose one answer for each offering. 0 = Not at all; 10 = A great deal.",
          "exportFields": [
            "V_Q15_S",
            "V_Q15_B"
          ]
        },
        {
          "id": "Q16",
          "number": 16,
          "oldRef": "Q16",
          "variable": "V_Q16",
          "text": "How interested would you be in using each type of shared electric vehicle for commuting on campus?",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Not at all interested"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5 = Extremely interested"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 5,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "help": "Choose one answer for each offering. 1 = Not at all interested; 5 = Extremely interested.",
          "exportFields": [
            "V_Q16_S",
            "V_Q16_B"
          ]
        },
        {
          "id": "Q17",
          "number": 17,
          "oldRef": "Q18",
          "variable": "V_Q17",
          "text": "Since you selected that you are not interested, for each offering you are not interested in, select all the reasons that apply.",
          "type": "product_multi",
          "options": [
            {
              "value": 1,
              "label": "I do not need additional on-campus transportation."
            },
            {
              "value": 2,
              "label": "I prefer my current way of getting around."
            },
            {
              "value": 3,
              "label": "The service would not cover the trips I need."
            },
            {
              "value": 4,
              "label": "Weather would make this option unsuitable for me."
            },
            {
              "value": 5,
              "label": "Using a smartphone app would be difficult for me."
            },
            {
              "value": 6,
              "label": "I need more information about the service."
            },
            {
              "value": 7,
              "label": "Other reason (specify separately for each service)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherFields": {
                "S": "V_Q17_Other_txt_S",
                "B": "V_Q17_Other_txt_B"
              }
            }
          ],
          "required": true,
          "condition": "uninterested_S || uninterested_B",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "uninterested_S",
            "B": "uninterested_B"
          },
          "exportFields": [
            "V_Q17_1_S",
            "V_Q17_2_S",
            "V_Q17_3_S",
            "V_Q17_4_S",
            "V_Q17_5_S",
            "V_Q17_6_S",
            "V_Q17_7_S",
            "V_Q17_Other_txt_S",
            "V_Q17_1_B",
            "V_Q17_2_B",
            "V_Q17_3_B",
            "V_Q17_4_B",
            "V_Q17_5_B",
            "V_Q17_6_B",
            "V_Q17_7_B",
            "V_Q17_Other_txt_B"
          ]
        }
      ]
    },
    {
      "id": "attitudes",
      "title": "Section 5 – What You Think About Electric Bikes and Scooters",
      "description": "For the statements about safety, comfort, and pickup and return requirements, rate each offering separately on a scale of 1 to 10, where 1 = Strongly disagree and 10 = Strongly agree.",
      "questions": [
        {
          "id": "Q18",
          "number": 18,
          "oldRef": "Q19",
          "variable": "V_Q18",
          "text": "To what extent do you agree that electric bikes and scooters help reduce the environmental impact of transportation on campus?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Strongly disagree"
            },
            {
              "value": 2,
              "label": "Disagree"
            },
            {
              "value": 3,
              "label": "Neutral"
            },
            {
              "value": 4,
              "label": "Agree"
            },
            {
              "value": 5,
              "label": "Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "exportFields": [
            "V_Q18"
          ]
        },
        {
          "id": "Q19",
          "number": 19,
          "oldRef": "Q20a",
          "variable": "V_Q19",
          "text": "I would feel safe using this transportation option.",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Strongly disagree"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "exportFields": [
            "V_Q19_S",
            "V_Q19_B"
          ]
        },
        {
          "id": "Q20",
          "number": 20,
          "oldRef": "Q20b",
          "variable": "V_Q20",
          "text": "I would be comfortable operating this type of vehicle.",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Strongly disagree"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "exportFields": [
            "V_Q20_S",
            "V_Q20_B"
          ]
        },
        {
          "id": "Q21",
          "number": 21,
          "oldRef": "Q20c",
          "variable": "V_Q21",
          "text": "The pickup and return requirements would be convenient for me.",
          "type": "product_scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Strongly disagree"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Strongly agree"
            }
          ],
          "required": true,
          "condition": "eligible",
          "products": [
            "S",
            "B"
          ],
          "min": 1,
          "max": 10,
          "decimals": 0,
          "productConditions": {
            "S": "eligible",
            "B": "eligible"
          },
          "exportFields": [
            "V_Q21_S",
            "V_Q21_B"
          ]
        }
      ]
    },
    {
      "id": "charger",
      "title": "Section 6 – Charger Program",
      "description": "BNS also plans to add a separate “charger” version of the app. Students can earn money by charging eZ2 vehicles at charging stations so they are ready for riders.",
      "questions": [
        {
          "id": "Q22",
          "number": 22,
          "oldRef": "Q21",
          "variable": "V_Q22",
          "text": "How interested, if at all, would you be in charging shared electric vehicles in exchange for compensation?",
          "type": "scale",
          "options": [
            {
              "value": 1,
              "label": "1 = Not at all interested"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5 = Extremely interested"
            }
          ],
          "required": true,
          "condition": "eligible",
          "min": 1,
          "max": 5,
          "decimals": 0,
          "exportFields": [
            "V_Q22"
          ]
        },
        {
          "id": "Q23",
          "number": 23,
          "oldRef": "Q22",
          "variable": "V_Q23_band",
          "text": "What is the minimum payment per vehicle charged that would make you consider taking part in the charger program?",
          "type": "single",
          "options": [
            {
              "value": 0,
              "label": "$0 — I would consider doing it without payment",
              "interval": {
                "lower": 0,
                "upper": 0,
                "lowerInclusive": true,
                "upperInclusive": true
              }
            },
            {
              "value": 1,
              "label": "More than $0 but less than $2",
              "interval": {
                "lower": 0,
                "upper": 2,
                "lowerInclusive": false,
                "upperInclusive": false
              }
            },
            {
              "value": 2,
              "label": "$2 to less than $5",
              "interval": {
                "lower": 2,
                "upper": 5,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 3,
              "label": "$5 to less than $10",
              "interval": {
                "lower": 5,
                "upper": 10,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 4,
              "label": "$10 to less than $15",
              "interval": {
                "lower": 10,
                "upper": 15,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 5,
              "label": "$15 or more",
              "interval": {
                "lower": 15,
                "upper": null,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 99,
              "label": "Not sure yet"
            }
          ],
          "required": true,
          "condition": "charger_interest",
          "help": "Choose the range containing the smallest payment you would accept for one vehicle. Choose Not sure yet if you need more information about the work involved.",
          "exportFields": [
            "V_Q23_band"
          ],
          "missingValues": [
            99
          ],
          "measurement": {
            "kind": "ordered_category",
            "unit": "USD_per_vehicle_charged",
            "coding": "Values are category codes, not measured quantities. 99 is unknown and is exported as missing; 0 is a substantive zero. Do not calculate means of the codes or silently replace categories with midpoints."
          }
        }
      ]
    },
    {
      "id": "expected_use",
      "title": "Section 7 – Expected Use and Campus Travel Budget",
      "questions": [
        {
          "id": "Q24",
          "number": 24,
          "oldRef": "Q23",
          "variable": "V_Q24_band",
          "text": "In a typical week during the semester, about how much time would you spend actually riding each offering on campus?",
          "type": "product_single",
          "options": [
            {
              "value": 0,
              "label": "0 — I would not ride it in a typical week",
              "interval": {
                "lower": 0,
                "upper": 0,
                "lowerInclusive": true,
                "upperInclusive": true
              }
            },
            {
              "value": 1,
              "label": "More than 0 but less than 30 minutes",
              "interval": {
                "lower": 0,
                "upper": 0.5,
                "lowerInclusive": false,
                "upperInclusive": false
              }
            },
            {
              "value": 2,
              "label": "30 minutes to less than 1 hour",
              "interval": {
                "lower": 0.5,
                "upper": 1,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 3,
              "label": "1 to less than 2 hours",
              "interval": {
                "lower": 1,
                "upper": 2,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 4,
              "label": "2 to less than 3 hours",
              "interval": {
                "lower": 2,
                "upper": 3,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 5,
              "label": "3 to less than 5 hours",
              "interval": {
                "lower": 3,
                "upper": 5,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 6,
              "label": "5 hours or more",
              "interval": {
                "lower": 5,
                "upper": null,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 99,
              "label": "Not sure yet"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "interested_S",
            "B": "interested_B"
          },
          "help": "Choose one range for each offering shown. Count riding time only, not time parked or kept between trips. Choose 0 if you would not ride it in a typical week, or Not sure yet if you cannot estimate.",
          "exportFields": [
            "V_Q24_band_S",
            "V_Q24_band_B"
          ],
          "missingValues": [
            99
          ],
          "measurement": {
            "kind": "ordered_category",
            "unit": "hours_per_week",
            "coding": "Values are category codes, not measured quantities. 99 is unknown and is exported as missing; 0 is a substantive zero. Do not calculate means of the codes or silently replace categories with midpoints."
          }
        },
        {
          "id": "Q25",
          "number": 25,
          "oldRef": "Q24",
          "variable": "V_Q25_band",
          "text": "What is the longest you would be willing to walk to pick up an available vehicle on campus?",
          "type": "product_single",
          "options": [
            {
              "value": 0,
              "label": "0 minutes — only if a vehicle is already where I am",
              "interval": {
                "lower": 0,
                "upper": 0,
                "lowerInclusive": true,
                "upperInclusive": true
              }
            },
            {
              "value": 1,
              "label": "More than 0 but less than 5 minutes",
              "interval": {
                "lower": 0,
                "upper": 5,
                "lowerInclusive": false,
                "upperInclusive": false
              }
            },
            {
              "value": 2,
              "label": "5 to less than 10 minutes",
              "interval": {
                "lower": 5,
                "upper": 10,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 3,
              "label": "10 to less than 15 minutes",
              "interval": {
                "lower": 10,
                "upper": 15,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 4,
              "label": "15 to less than 20 minutes",
              "interval": {
                "lower": 15,
                "upper": 20,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 5,
              "label": "20 minutes or more",
              "interval": {
                "lower": 20,
                "upper": null,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 99,
              "label": "Not sure yet"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "interested_S",
            "B": "interested_B"
          },
          "help": "Choose one range for each offering shown. Think about one pickup, not your total walking time for the day.",
          "exportFields": [
            "V_Q25_band_S",
            "V_Q25_band_B"
          ],
          "missingValues": [
            99
          ],
          "measurement": {
            "kind": "ordered_category",
            "unit": "minutes_per_pickup",
            "coding": "Values are category codes, not measured quantities. 99 is unknown and is exported as missing; 0 is a substantive zero. Do not calculate means of the codes or silently replace categories with midpoints."
          }
        },
        {
          "id": "Q26",
          "number": 26,
          "oldRef": "Q25",
          "variable": "V_Q26_band",
          "text": "What is the most you would be willing to spend in total per month on travel between places on campus, across all transportation options?",
          "type": "single",
          "options": [
            {
              "value": 0,
              "label": "$0 — I would not be willing to spend money on this",
              "interval": {
                "lower": 0,
                "upper": 0,
                "lowerInclusive": true,
                "upperInclusive": true
              }
            },
            {
              "value": 1,
              "label": "More than $0 but less than $10",
              "interval": {
                "lower": 0,
                "upper": 10,
                "lowerInclusive": false,
                "upperInclusive": false
              }
            },
            {
              "value": 2,
              "label": "$10 to less than $20",
              "interval": {
                "lower": 10,
                "upper": 20,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 3,
              "label": "$20 to less than $40",
              "interval": {
                "lower": 20,
                "upper": 40,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 4,
              "label": "$40 to less than $60",
              "interval": {
                "lower": 40,
                "upper": 60,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 5,
              "label": "$60 to less than $100",
              "interval": {
                "lower": 60,
                "upper": 100,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 6,
              "label": "$100 or more",
              "interval": {
                "lower": 100,
                "upper": null,
                "lowerInclusive": true,
                "upperInclusive": false
              }
            },
            {
              "value": 99,
              "label": "Not sure yet"
            }
          ],
          "required": true,
          "condition": "eligible",
          "help": "Include all ways of getting around on campus, not just eZ2 Wheels. Do not include travel to and from campus. Choose the range containing your maximum monthly amount.",
          "exportFields": [
            "V_Q26_band"
          ],
          "missingValues": [
            99
          ],
          "measurement": {
            "kind": "ordered_category",
            "unit": "USD_per_month",
            "coding": "Values are category codes, not measured quantities. 99 is unknown and is exported as missing; 0 is a substantive zero. Do not calculate means of the codes or silently replace categories with midpoints."
          }
        }
      ]
    },
    {
      "id": "pricing",
      "title": "Section 8 – Pricing Preferences",
      "questions": [
        {
          "id": "Q27",
          "number": 27,
          "oldRef": "Q26",
          "variable": "V_Q27",
          "text": "For each offering, which ONE pricing scheme would you prefer?",
          "type": "product_single",
          "options": [
            {
              "value": 1,
              "label": "Scheme 1 – Pay per use"
            },
            {
              "value": 2,
              "label": "Scheme 2 – Semester subscription"
            },
            {
              "value": 3,
              "label": "Scheme 3 – Hybrid"
            },
            {
              "value": 4,
              "label": "None of these (would not choose any)"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "interested_S",
            "B": "interested_B"
          },
          "exportFields": [
            "V_Q27_S",
            "V_Q27_B"
          ]
        },
        {
          "id": "Q28",
          "number": 28,
          "oldRef": "Q27",
          "variable": "V_Q28",
          "text": "Why did you choose that scheme? Select all that apply for each offering shown.",
          "type": "product_multi",
          "options": [
            {
              "value": 1,
              "label": "Lowest total cost for how much I would ride"
            },
            {
              "value": 2,
              "label": "Flexibility – only pay when I ride"
            },
            {
              "value": 3,
              "label": "No commitment"
            },
            {
              "value": 4,
              "label": "Easy to understand"
            },
            {
              "value": 5,
              "label": "Predictable monthly/semester cost"
            },
            {
              "value": 6,
              "label": "Best fit for how often I would ride"
            },
            {
              "value": 7,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherFields": {
                "S": "V_Q28_Other_txt_S",
                "B": "V_Q28_Other_txt_B"
              }
            }
          ],
          "required": true,
          "condition": "chose_plan_S || chose_plan_B",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "chose_plan_S",
            "B": "chose_plan_B"
          },
          "exportFields": [
            "V_Q28_1_S",
            "V_Q28_2_S",
            "V_Q28_3_S",
            "V_Q28_4_S",
            "V_Q28_5_S",
            "V_Q28_6_S",
            "V_Q28_7_S",
            "V_Q28_Other_txt_S",
            "V_Q28_1_B",
            "V_Q28_2_B",
            "V_Q28_3_B",
            "V_Q28_4_B",
            "V_Q28_5_B",
            "V_Q28_6_B",
            "V_Q28_7_B",
            "V_Q28_Other_txt_B"
          ]
        },
        {
          "id": "Q29",
          "number": 29,
          "oldRef": "Q28",
          "variable": "V_Q29",
          "text": "Why would you not choose any of the schemes? Select all that apply for each offering shown.",
          "type": "product_multi",
          "options": [
            {
              "value": 1,
              "label": "Too expensive overall"
            },
            {
              "value": 2,
              "label": "I would not ride enough to justify any of them"
            },
            {
              "value": 3,
              "label": "I would want a different kind of plan (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please describe the kind of plan you would want.",
              "otherFields": {
                "S": "V_Q29_DifferentPlan_txt_S",
                "B": "V_Q29_DifferentPlan_txt_B"
              }
            },
            {
              "value": 4,
              "label": "Plans are confusing"
            },
            {
              "value": 5,
              "label": "I would only use it occasionally and want a free/very cheap option"
            },
            {
              "value": 6,
              "label": "Other (specify)",
              "other": true,
              "otherRequired": true,
              "otherMaxLength": 40,
              "otherPrompt": "Please specify.",
              "otherFields": {
                "S": "V_Q29_Other_txt_S",
                "B": "V_Q29_Other_txt_B"
              }
            }
          ],
          "required": true,
          "condition": "chose_none_S || chose_none_B",
          "products": [
            "S",
            "B"
          ],
          "productConditions": {
            "S": "chose_none_S",
            "B": "chose_none_B"
          },
          "exportFields": [
            "V_Q29_1_S",
            "V_Q29_2_S",
            "V_Q29_3_S",
            "V_Q29_4_S",
            "V_Q29_5_S",
            "V_Q29_6_S",
            "V_Q29_DifferentPlan_txt_S",
            "V_Q29_Other_txt_S",
            "V_Q29_1_B",
            "V_Q29_2_B",
            "V_Q29_3_B",
            "V_Q29_4_B",
            "V_Q29_5_B",
            "V_Q29_6_B",
            "V_Q29_DifferentPlan_txt_B",
            "V_Q29_Other_txt_B"
          ]
        }
      ]
    },
    {
      "id": "beyond",
      "title": "Section 9 – Beyond Campus and Final Comment",
      "description": "BNS hopes to later sell these vehicles to the public.",
      "questions": [
        {
          "id": "Q30",
          "number": 30,
          "oldRef": "Q29",
          "variable": "V_Q30",
          "text": "If eZ2 S or eZ2 B were available to the general public off campus (rent in your city), how likely would you be to use it?",
          "type": "scale",
          "options": [
            {
              "value": 0,
              "label": "0 = Not at all likely"
            },
            {
              "value": 1,
              "label": "1"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Extremely likely"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "min": 0,
          "max": 10,
          "decimals": 0,
          "exportFields": [
            "V_Q30"
          ]
        },
        {
          "id": "Q31",
          "number": 31,
          "oldRef": "Q30",
          "variable": "V_Q31",
          "text": "If you could buy (instead of renting) an eZ2 vehicle of your own for use off campus, how likely would you be to buy one?",
          "type": "scale",
          "options": [
            {
              "value": 0,
              "label": "0 = Not at all likely"
            },
            {
              "value": 1,
              "label": "1"
            },
            {
              "value": 2,
              "label": "2"
            },
            {
              "value": 3,
              "label": "3"
            },
            {
              "value": 4,
              "label": "4"
            },
            {
              "value": 5,
              "label": "5"
            },
            {
              "value": 6,
              "label": "6"
            },
            {
              "value": 7,
              "label": "7"
            },
            {
              "value": 8,
              "label": "8"
            },
            {
              "value": 9,
              "label": "9"
            },
            {
              "value": 10,
              "label": "10 = Extremely likely"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "min": 0,
          "max": 10,
          "decimals": 0,
          "exportFields": [
            "V_Q31"
          ]
        },
        {
          "id": "Q32",
          "number": 32,
          "oldRef": "Q31",
          "variable": "V_Q32",
          "text": "Would you tell friends or family about eZ2 Wheels, share it on social media, or otherwise recommend it?",
          "type": "single",
          "options": [
            {
              "value": 1,
              "label": "Yes, definitely"
            },
            {
              "value": 2,
              "label": "Maybe"
            },
            {
              "value": 3,
              "label": "No"
            }
          ],
          "required": true,
          "condition": "any_interest",
          "exportFields": [
            "V_Q32"
          ]
        },
        {
          "id": "Q33",
          "number": 33,
          "oldRef": "Q32 (Q33 in the original drafting note)",
          "variable": "V_Q33",
          "text": "Anything else you would like to tell BNS?",
          "type": "text",
          "options": [],
          "required": false,
          "condition": "eligible",
          "maxLength": 100,
          "help": "Optional.",
          "exportFields": [
            "V_Q33"
          ]
        }
      ]
    }
  ]
};


// Review draft 2.3: shared rules.
/* Pure survey rules shared by the browser, exports and Node tests. No browser APIs. */
const PRODUCT_NAMES = {S:'Electric scooter (eZ2 S)',B:'Electric bike (eZ2 B)'};
const allQuestions = schema => schema.sections.flatMap(section => section.questions);
const keyFor = (q, product) => product ? `${q.id}_${product}` : q.id;
const otherKey = (key, option) => `${key}__${option.value}_text`;
const hasValue = value => value !== undefined && value !== null && value !== '';
const same = (a,b) => String(a) === String(b);
function conditionMet(condition, answers) {
  if (condition?.includes('||')) return condition.split('||').some(part=>conditionMet(part.trim(),answers));
  const eligible = same(answers.Q1, 1);
  const interest = p => Number(answers[`Q16_${p}`]) >= 2 && Number(answers[`Q16_${p}`]) <= 5;
  if (!condition || condition === 'always') return true;
  if (condition === 'eligible') return eligible;
  if (!eligible) return false;
  if (condition === 'experienced') return ['number','string'].includes(typeof answers.Q12) && [2,3,4,5].some(value => same(answers.Q12, value));
  if (condition === 'any_interest') return interest('S') || interest('B');
  if (condition === 'charger_interest') return Number(answers.Q22) >= 2 && Number(answers.Q22) <= 5;
  const [_, p] = condition.match(/_([SB])$/) || [];
  if (condition.startsWith('uninterested_')) return same(answers[`Q16_${p}`], 1);
  if (condition.startsWith('interested_')) return interest(p);
  if (condition.startsWith('chose_plan_')) return interest(p) && [1,2,3].includes(Number(answers[`Q27_${p}`]));
  if (condition.startsWith('chose_none_')) return interest(p) && same(answers[`Q27_${p}`], 4);
  throw new Error(`Unknown condition: ${condition}`);
}
function visibleProducts(q, answers) {
  return (q.products || ['S','B']).filter(p => conditionMet(q.productConditions?.[p] || q.condition, answers));
}
function isVisible(q, answers) {
  return conditionMet(q.condition, answers) && (!q.type.startsWith('product_') || visibleProducts(q, answers).length > 0);
}
function expandedQuestions(schema, answers) {
  return allQuestions(schema).flatMap(q => {
    if (!isVisible(q, answers)) return [];
    return q.type.startsWith('product_')
      ? visibleProducts(q, answers).map(product => ({q, product, key:keyFor(q, product)}))
      : [{q, product:null, key:q.id}];
  });
}
function cleanAnswers(schema, answers) {
  // Iterate until changes to an upstream answer have removed every hidden descendant.
  let result = {...answers};
  for (let iteration=0; iteration<4; iteration++) {
    const cleaned = {};
    for (const {q,key} of expandedQuestions(schema,result)) {
      if (Object.prototype.hasOwnProperty.call(result,key)) cleaned[key] = result[key];
      for (const option of q.options || []) {
        const selected = Array.isArray(result[key]) ? result[key].some(v => same(v, option.value)) : same(result[key],option.value);
        const detailKey = otherKey(key,option);
        if (option.other && selected && Object.prototype.hasOwnProperty.call(result,detailKey)) cleaned[detailKey] = result[detailKey];
      }
    }
    if (JSON.stringify(result) === JSON.stringify(cleaned)) return cleaned;
    result = cleaned;
  }
  return result;
}
function validateItem(q,key,answers) {
  const errors=[];
  const value=answers[key];
  const type=q.type.replace('product_','');
  const empty=!hasValue(value) || (type==='multi' && Array.isArray(value) && value.length===0);
  if (empty) return q.required ? [{key,message:'Please answer this question.'}] : [];
  if (type==='single' || type==='multi') {
    const options=(q.options || []).map(o=>String(o.value));
    const selected=type==='multi' ? value : [value];
    if (!Array.isArray(selected) || selected.some(v=>!['number','string'].includes(typeof v)||!options.includes(String(v))) || (type==='multi' && new Set(selected.map(String)).size!==selected.length)) {
      errors.push({key,message:'Please select a valid answer.'});
    }
  }
  if (type==='number' || type==='scale') {
    const number=typeof value==='number' ? value : Number(String(value).trim());
    if (!['number','string'].includes(typeof value) || (typeof value==='string' && !/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) || !Number.isFinite(number)) errors.push({key,message:'Please enter a valid number.'});
    else if (q.min!==undefined && number<q.min) errors.push({key,message:`Enter a number of at least ${q.min}.`});
    else if (q.max!==undefined && number>q.max) errors.push({key,message:`Enter a number no greater than ${q.max}.`});
    else if ((type==='scale' || q.decimals===0) && !Number.isInteger(number)) errors.push({key,message:'Please enter a whole number.'});
    else if (q.decimals!==undefined && Math.abs(number*10**q.decimals-Math.round(number*10**q.decimals))>1e-7) errors.push({key,message:`Use no more than ${q.decimals} decimal place${q.decimals===1?'':'s'}.`});
  }
  if (type==='text') {
    if (typeof value!=='string') errors.push({key,message:'Please enter text.'});
    else if (!value.trim() && q.required) errors.push({key,message:'Please enter an answer.'});
    else if (q.maxLength && value.length>q.maxLength) errors.push({key,message:`Use ${q.maxLength} characters or fewer.`});
  }
  for (const option of q.options || []) {
    const selected=Array.isArray(value) ? value.some(v=>same(v,option.value)) : same(value,option.value);
    if (!option.other || !selected) continue;
    const detailKey=otherKey(key,option), text=answers[detailKey];
    if (option.otherRequired && (typeof text!=='string' || !text.trim())) errors.push({key:detailKey,message:'Please specify your answer.'});
    else if (hasValue(text) && (typeof text!=='string' || (option.otherMaxLength && text.length>option.otherMaxLength))) errors.push({key:detailKey,message:`Use ${option.otherMaxLength || 100} characters or fewer.`});
  }
  return errors;
}
function validateAll(schema,answers) {
  const cleaned=cleanAnswers(schema,answers);
  return expandedQuestions(schema,cleaned).flatMap(({q,key})=>validateItem(q,key,cleaned));
}
function shuffledPlans(rng=Math.random) {
  const result=[1,2,3];
  for (let i=result.length-1;i>0;i--) {const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
function orderedOptions(q,planOrder) {
  if (q.id!=='Q27') return q.options || [];
  const options=q.options || [];
  return [...planOrder.map(value=>options.find(o=>same(o.value,value))).filter(Boolean),...options.filter(o=>!planOrder.some(v=>same(v,o.value)))];
}
function normalizedValue(q,value) {
  if (!hasValue(value)) return '';
  // Keep declared NA codes in raw answers, but exclude them from analysis values.
  if ((q.missingValues || []).some(code => same(code,value))) return '';
  const type=q.type.replace('product_','');
  if (type==='number' || type==='scale') return Number(value);
  if (type==='text') return String(value).trim();
  if (type==='single') return (q.options || []).find(o=>same(o.value,value))?.value ?? value;
  return value;
}
function makeRecord(schema,input,metadata) {
  const errors=validateAll(schema,input);
  if (errors.length) throw new Error(`The response has ${errors.length} unanswered or invalid field(s).`);
  const answers=cleanAnswers(schema,input), asked={}, flat={};
  const visible=new Set(expandedQuestions(schema,answers).map(item=>item.key));
  for (const q of allQuestions(schema)) {
    const products=q.type.startsWith('product_') ? q.products || ['S','B'] : [null];
    for (const product of products) {
      const key=keyFor(q,product), wasAsked=visible.has(key), suffix=product?`_${product}`:'', base=q.variable || `V_${q.id}`;
      asked[key]=wasAsked;
      const type=q.type.replace('product_',''), value=answers[key];
      if (type==='multi') {
        for (const option of q.options || []) {
          const field=`${base}_${option.value}${suffix}`;
          flat[field]=wasAsked && hasValue(value) ? (value.some(v=>same(v,option.value))?1:0) : '';
          flat[`${field}__asked`]=wasAsked?1:0;
        }
      } else {
        const field=`${base}${suffix}`;
        flat[field]=wasAsked?normalizedValue(q,value):'';
        flat[`${field}__asked`]=wasAsked?1:0;
      }
      for (const option of q.options || []) {
        if (!option.other) continue;
        const field=product ? option.otherFields?.[product] : option.otherField;
        const name=field || `${base}_Other_txt${suffix}`;
        const selected=wasAsked && (Array.isArray(value)?value.some(v=>same(v,option.value)):same(value,option.value));
        flat[name]=selected?String(answers[otherKey(key,option)] || '').trim():'';
        flat[`${name}__asked`]=selected?1:0;
        asked[otherKey(key,option)]=selected;
      }
    }
  }
  return {schemaVersion:schema.version,surveyTitle:schema.title,responseId:metadata.responseId,startedAt:metadata.startedAt,completedAt:metadata.completedAt,planOrder:metadata.planOrder,answers,asked,flat};
}
function csvCell(value) {
  let text=value===null || value===undefined?'':String(value);
  // Preserve numeric values while preventing spreadsheet formula execution in text.
  if (typeof value==='string' && /^[=+\-@\t\r]/.test(text)) text=`'${text}`;
  return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}
function recordsToCsv(records) {
  if (!records.length) return '';
  if (new Set(records.map(record=>record.schemaVersion)).size!==1) throw new Error('Do not combine different survey versions in one CSV export.');
  const fields=[...new Set(records.flatMap(record=>Object.keys(record.flat)))];
  const meta=['response_id','schema_version','started_at','completed_at','plan_order'];
  const lines=[[...meta,...fields].map(csvCell).join(',')];
  for (const r of records) lines.push([r.responseId,r.schemaVersion,r.startedAt,r.completedAt,(r.planOrder||[]).join('|'),...fields.map(field=>r.flat[field]??'')].map(csvCell).join(','));
  return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
function verifyImportedRecord(schema,record) {
  if (!record || record.schemaVersion!==schema.version) throw new Error('Survey version does not match.');
  if (typeof record.responseId!=='string' || !/^[a-zA-Z0-9-]{8,80}$/.test(record.responseId)) throw new Error('Missing or invalid response ID.');
  if (!record.answers || typeof record.answers!=='object' || Array.isArray(record.answers)) throw new Error('Missing response answers.');
  if (!same(record.answers.Q1,1)) throw new Error('This is not an eligible completed response.');
  if (!Array.isArray(record.planOrder) || record.planOrder.map(Number).sort().join(',')!=='1,2,3') throw new Error('Invalid plan order.');
  if (!Number.isFinite(Date.parse(record.startedAt)) || !Number.isFinite(Date.parse(record.completedAt))) throw new Error('Invalid response dates.');
  // Recompute all export data; imported flat/asked values are not trusted.
  return makeRecord(schema,record.answers,record);
}



return Object.freeze({schema:SURVEY_SCHEMA,cleanAnswers:cleanAnswers,validateAll:validateAll,makeRecord:makeRecord});
})()
});
const UNIFIED_HEADERS_=Object.freeze([
  "submission_id",
  "received_at_utc",
  "survey_version",
  "started_at_utc",
  "completed_at_utc",
  "plan_order",
  "payload_sha256",
  "V_Q1",
  "V_Q1__asked",
  "V_Q2",
  "V_Q2__asked",
  "V_Q3",
  "V_Q3__asked",
  "V_Q4",
  "V_Q4__asked",
  "V_Q5",
  "V_Q5__asked",
  "V_Q6",
  "V_Q6__asked",
  "V_Q7",
  "V_Q7__asked",
  "V_Q8_1",
  "V_Q8_1__asked",
  "V_Q8_2",
  "V_Q8_2__asked",
  "V_Q8_3",
  "V_Q8_3__asked",
  "V_Q8_4",
  "V_Q8_4__asked",
  "V_Q8_5",
  "V_Q8_5__asked",
  "V_Q8_6",
  "V_Q8_6__asked",
  "V_Q8_7",
  "V_Q8_7__asked",
  "V_Q8_8",
  "V_Q8_8__asked",
  "V_Q8_Other_txt",
  "V_Q8_Other_txt__asked",
  "V_Q9",
  "V_Q9__asked",
  "V_Q10",
  "V_Q10__asked",
  "V_Q11",
  "V_Q11__asked",
  "V_Q12",
  "V_Q12__asked",
  "V_Q13_1",
  "V_Q13_1__asked",
  "V_Q13_2",
  "V_Q13_2__asked",
  "V_Q13_3",
  "V_Q13_3__asked",
  "V_Q13_4",
  "V_Q13_4__asked",
  "V_Q13_Other_txt",
  "V_Q13_Other_txt__asked",
  "V_Q14",
  "V_Q14__asked",
  "V_Q15_S",
  "V_Q15_S__asked",
  "V_Q15_B",
  "V_Q15_B__asked",
  "V_Q16_S",
  "V_Q16_S__asked",
  "V_Q16_B",
  "V_Q16_B__asked",
  "V_Q17_1_S",
  "V_Q17_1_S__asked",
  "V_Q17_2_S",
  "V_Q17_2_S__asked",
  "V_Q17_3_S",
  "V_Q17_3_S__asked",
  "V_Q17_4_S",
  "V_Q17_4_S__asked",
  "V_Q17_5_S",
  "V_Q17_5_S__asked",
  "V_Q17_6_S",
  "V_Q17_6_S__asked",
  "V_Q17_7_S",
  "V_Q17_7_S__asked",
  "V_Q17_Other_txt_S",
  "V_Q17_Other_txt_S__asked",
  "V_Q17_1_B",
  "V_Q17_1_B__asked",
  "V_Q17_2_B",
  "V_Q17_2_B__asked",
  "V_Q17_3_B",
  "V_Q17_3_B__asked",
  "V_Q17_4_B",
  "V_Q17_4_B__asked",
  "V_Q17_5_B",
  "V_Q17_5_B__asked",
  "V_Q17_6_B",
  "V_Q17_6_B__asked",
  "V_Q17_7_B",
  "V_Q17_7_B__asked",
  "V_Q17_Other_txt_B",
  "V_Q17_Other_txt_B__asked",
  "V_Q18",
  "V_Q18__asked",
  "V_Q19_S",
  "V_Q19_S__asked",
  "V_Q19_B",
  "V_Q19_B__asked",
  "V_Q20_S",
  "V_Q20_S__asked",
  "V_Q20_B",
  "V_Q20_B__asked",
  "V_Q21_S",
  "V_Q21_S__asked",
  "V_Q21_B",
  "V_Q21_B__asked",
  "V_Q22",
  "V_Q22__asked",
  "V_Q23_band",
  "V_Q23_band__asked",
  "V_Q24_band_S",
  "V_Q24_band_S__asked",
  "V_Q24_band_B",
  "V_Q24_band_B__asked",
  "V_Q25_band_S",
  "V_Q25_band_S__asked",
  "V_Q25_band_B",
  "V_Q25_band_B__asked",
  "V_Q26_band",
  "V_Q26_band__asked",
  "V_Q27_S",
  "V_Q27_S__asked",
  "V_Q27_B",
  "V_Q27_B__asked",
  "V_Q28_1_S",
  "V_Q28_1_S__asked",
  "V_Q28_2_S",
  "V_Q28_2_S__asked",
  "V_Q28_3_S",
  "V_Q28_3_S__asked",
  "V_Q28_4_S",
  "V_Q28_4_S__asked",
  "V_Q28_5_S",
  "V_Q28_5_S__asked",
  "V_Q28_6_S",
  "V_Q28_6_S__asked",
  "V_Q28_7_S",
  "V_Q28_7_S__asked",
  "V_Q28_Other_txt_S",
  "V_Q28_Other_txt_S__asked",
  "V_Q28_1_B",
  "V_Q28_1_B__asked",
  "V_Q28_2_B",
  "V_Q28_2_B__asked",
  "V_Q28_3_B",
  "V_Q28_3_B__asked",
  "V_Q28_4_B",
  "V_Q28_4_B__asked",
  "V_Q28_5_B",
  "V_Q28_5_B__asked",
  "V_Q28_6_B",
  "V_Q28_6_B__asked",
  "V_Q28_7_B",
  "V_Q28_7_B__asked",
  "V_Q28_Other_txt_B",
  "V_Q28_Other_txt_B__asked",
  "V_Q29_1_S",
  "V_Q29_1_S__asked",
  "V_Q29_2_S",
  "V_Q29_2_S__asked",
  "V_Q29_3_S",
  "V_Q29_3_S__asked",
  "V_Q29_4_S",
  "V_Q29_4_S__asked",
  "V_Q29_5_S",
  "V_Q29_5_S__asked",
  "V_Q29_6_S",
  "V_Q29_6_S__asked",
  "V_Q29_DifferentPlan_txt_S",
  "V_Q29_DifferentPlan_txt_S__asked",
  "V_Q29_Other_txt_S",
  "V_Q29_Other_txt_S__asked",
  "V_Q29_1_B",
  "V_Q29_1_B__asked",
  "V_Q29_2_B",
  "V_Q29_2_B__asked",
  "V_Q29_3_B",
  "V_Q29_3_B__asked",
  "V_Q29_4_B",
  "V_Q29_4_B__asked",
  "V_Q29_5_B",
  "V_Q29_5_B__asked",
  "V_Q29_6_B",
  "V_Q29_6_B__asked",
  "V_Q29_DifferentPlan_txt_B",
  "V_Q29_DifferentPlan_txt_B__asked",
  "V_Q29_Other_txt_B",
  "V_Q29_Other_txt_B__asked",
  "V_Q30",
  "V_Q30__asked",
  "V_Q31",
  "V_Q31__asked",
  "V_Q32",
  "V_Q32__asked",
  "V_Q33",
  "V_Q33__asked",
  "V_Q23",
  "V_Q23__asked",
  "V_Q24_S",
  "V_Q24_S__asked",
  "V_Q24_B",
  "V_Q24_B__asked",
  "V_Q25_S",
  "V_Q25_S__asked",
  "V_Q25_B",
  "V_Q25_B__asked",
  "V_Q26",
  "V_Q26__asked"
]);
/* Google Sheets receiver for the eZ2 survey. Deploy only after following README.md.
 * Both schema engines are bundled in this file.
 * This file never publishes the response sheet or returns stored answers.
 */
const BACKEND_SETTINGS = Object.freeze({
  sheetName: 'Responses',
  maxPostBytes: 131072,
  maxPayloadCharacters: 32768,
  maxAnswerCharacters: 4096,
  maxAnswerKeys: 160,
  lockWaitMs: 15000
});

function doGet() {
  return receiptPage_('Survey submission endpoint',
    'Open the survey link to complete the questionnaire. This address accepts survey submissions only.', null, safeReturnUrl_());
}

function doPost(e) {
  try {
    const config = backendConfig_();
    const packet = readPacket_(e);
    const record = canonicalRecord_(packet);
    const receipt = saveRecord_(config, record);
    return receiptPage_('Your response has been saved',
      receipt.duplicate ? 'This response was already received. No duplicate row was added.' : 'Thank you for taking part in the survey.',
      receipt, config.returnUrl);
  } catch (error) {
    // Deliberately do not log the request, answers, spreadsheet ID, or return URL.
    console.warn('Survey submission failed: ' + (error.publicMessage ? 'validation' : 'storage/configuration'));
    return receiptPage_('Your response could not be saved',
      error.publicMessage || 'The survey could not save your response. Please return to the survey and try again later, or contact the survey organizer.',
      null, safeReturnUrl_());
  }
}

function backendConfig_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = String(props.getProperty('SPREADSHEET_ID') || '').trim();
  const returnUrl = String(props.getProperty('RETURN_URL') || '').trim();
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(spreadsheetId)) throw new Error('Missing/invalid SPREADSHEET_ID');
  if (!validReturnUrl_(returnUrl)) throw new Error('Missing/invalid RETURN_URL');
  return { spreadsheetId: spreadsheetId, returnUrl: returnUrl };
}

function validReturnUrl_(value) {
  // Only an owner-configured HTTPS URL is used. Never take a URL from the packet.
  return typeof value === 'string' && value.length <= 2048 &&
    /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?(?:[/?#][^\s<>"'\\]*)?$/.test(value);
}

function safeReturnUrl_() {
  try {
    const value = String(PropertiesService.getScriptProperties().getProperty('RETURN_URL') || '').trim();
    return validReturnUrl_(value) ? value : '';
  } catch (_) { return ''; }
}

function readPacket_(e) {
  if (!e || !e.parameter || !e.parameters) publicError_('No survey payload was received. Please submit from the questionnaire.');
  const byteCount = Number(e.contentLength || (e.postData && e.postData.length) || 0);
  if (!Number.isFinite(byteCount) || byteCount <= 0 || byteCount > BACKEND_SETTINGS.maxPostBytes) publicError_('The submitted response is too large or empty.');
  const names = Object.keys(e.parameters);
  if (names.length !== 1 || names[0] !== 'payload' || !Array.isArray(e.parameters.payload) || e.parameters.payload.length !== 1) publicError_('The submission format is invalid. Please reopen the survey.');
  const raw = e.parameter.payload;
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > BACKEND_SETTINGS.maxPayloadCharacters) publicError_('The submitted response is too large or empty.');
  let packet;
  try { packet = JSON.parse(raw); } catch (_) { publicError_('The submitted response could not be read. Please reopen the survey.'); }
  if (!plainObject_(packet)) publicError_('The submission format is invalid.');
  const allowed = ['schemaVersion', 'surveyTitle', 'responseId', 'startedAt', 'completedAt', 'planOrder', 'answers', 'asked', 'flat'];
  if (Object.keys(packet).some(function (key) { return allowed.indexOf(key) < 0; })) publicError_('The submission contains unsupported fields.');
  return packet;
}

function canonicalRecord_(packet) {
  const engine=engineForVersion_(packet.schemaVersion),schema=engine.schema;
  if (typeof packet.responseId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(packet.responseId)) publicError_('The response identifier is invalid. Please reopen the survey.');
  if (!plainObject_(packet.answers) || Object.keys(packet.answers).length > BACKEND_SETTINGS.maxAnswerKeys) publicError_('The answers are not in the expected format.');
  const allowedKeys = answerKeySet_(schema);
  Object.keys(packet.answers).forEach(function (key) {
    if (!allowedKeys.has(key)) publicError_('The response contains an unknown question field.');
    const value = packet.answers[key];
    if (Array.isArray(value)) {
      if (value.length > 20 || value.some(function (item) { return !answerScalar_(item); })) publicError_('A multiple-choice answer has an invalid format.');
    } else if (!answerScalar_(value) && value !== null) {
      publicError_('An answer has an invalid format.');
    }
  });
  const planOrder = packet.planOrder;
  if (!Array.isArray(planOrder) || planOrder.length !== 3 || planOrder.map(String).sort().join(',') !== '1,2,3') publicError_('The pricing display order is invalid. Please reopen the survey.');
  const startedAt = validTimestamp_(packet.startedAt);
  const completedAt = validTimestamp_(packet.completedAt);
  if (!startedAt || !completedAt || Date.parse(completedAt) < Date.parse(startedAt)) publicError_('The response timestamps are invalid. Please reopen the survey.');
  // The browser's derived flat/asked/surveyTitle values are intentionally ignored.
  const cleaned = engine.cleanAnswers(schema, packet.answers);
  if (String(cleaned.Q1) !== '1') publicError_('This questionnaire is for currently enrolled students at large public universities in the U.S. No response was saved.');
  const errors = engine.validateAll(schema, cleaned);
  if (errors.length) publicError_('Please review the questionnaire: ' + errors.slice(0, 4).map(function (item) { return item.key + ': ' + item.message; }).join(' '));
  return engine.makeRecord(schema, cleaned, {
    responseId: packet.responseId,
    startedAt: startedAt,
    completedAt: completedAt,
    planOrder: planOrder.map(String)
  });
}

function answerKeySet_(schema) {
  const keys = new Set();
  schema.sections.forEach(function (section) {
    section.questions.forEach(function (question) {
      const products = question.products || [null];
      products.forEach(function (product) {
        const key = question.id + (product ? '_' + product : '');
        keys.add(key);
        (question.options || []).forEach(function (option) {
          if (option.other) keys.add(key + '__' + option.value + '_text');
        });
      });
    });
  });
  return keys;
}

function answerScalar_(value) {
  return (typeof value === 'string' && value.length <= BACKEND_SETTINGS.maxAnswerCharacters) ||
    (typeof value === 'number' && Number.isFinite(value));
}

function validTimestamp_(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

function plainObject_(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.prototype.toString.call(value) === '[object Object]';
}

function checkHeaders_(sheet, headers) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() !== headers.length) throw new Error('Responses schema mismatch');
  const existing = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (JSON.stringify(existing) !== JSON.stringify(headers)) throw new Error('Responses headers mismatch');
}

function writeLiteralRow_(sheet, row, values) {
  // RichTextValue prevents Sheets formulas; a leading apostrophe also protects CSV exports.
  const rich = values.map(function (value) {
    let text = String(value == null ? '' : value);
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return SpreadsheetApp.newRichTextValue().setText(text).build();
  });
  sheet.getRange(row, 1, 1, values.length).setRichTextValues([rich]);
}

function digest_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
}

function publicError_(message) {
  const error = new Error(message);
  error.publicMessage = message;
  throw error;
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function receiptPage_(title, message, receipt, returnUrl) {
  const details = receipt ? '<p>Receipt: <code>' + escapeHtml_(receipt.submissionId) + '</code><br>Received (UTC): ' + escapeHtml_(receipt.receivedAt) + '</p>' : '';
  const link = returnUrl ? '<p><a href="' + escapeHtml_(returnUrl) + '" target="_top">Return to the survey</a></p>' : '';
  const html = '<!doctype html><html lang="en"><head><base target="_top"><style>body{font:18px/1.6 system-ui,sans-serif;background:#f4f7f5;color:#16382d;margin:0;padding:24px}main{max-width:680px;margin:10vh auto;background:white;border-radius:16px;padding:32px}h1{line-height:1.2}code{overflow-wrap:anywhere}a{color:#176b4e}</style></head><body><main><h1>' + escapeHtml_(title) + '</h1><p>' + escapeHtml_(message) + '</p>' + details + link + '</main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(title).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Shared runtime: versions remain separate; all sheet mutations use one script lock.
function engineForVersion_(version) {
  if(typeof version!=='string'||!Object.prototype.hasOwnProperty.call(SURVEY_ENGINES_,version))
    publicError_('This survey version is no longer accepted. Please reopen the current survey link.');
  return SURVEY_ENGINES_[version];
}
function sourceHeaders_(version) {
  const headers=['submission_id','received_at_utc','survey_version','started_at_utc','completed_at_utc','plan_order','payload_sha256'];
  engineForVersion_(version).schema.sections.forEach(function(s){s.questions.forEach(function(q){q.exportFields.forEach(function(f){headers.push(f,f+'__asked');});});});
  return headers;
}
function backendHeaders_(){return UNIFIED_HEADERS_.slice();}
function headerMatches_(sheet,headers) {
  return !!sheet&&sheet.getLastRow()>=1&&sheet.getLastColumn()===headers.length&&
    JSON.stringify(sheet.getRange(1,1,1,headers.length).getDisplayValues()[0])===JSON.stringify(headers);
}
function unionFlat_(record) {
  const result={};
  UNIFIED_HEADERS_.slice(7).forEach(function(key){
    result[key]=Object.prototype.hasOwnProperty.call(record.flat,key)?record.flat[key]:(key.endsWith('__asked')?0:'');
  });
  return result;
}
// Validation only: migration, never setup, creates the new destination.
function setupSurveySheet() {
  const config=backendConfig_(),lock=LockService.getScriptLock();
  lock.waitLock(BACKEND_SETTINGS.lockWaitMs);
  try {
    const sheet=SpreadsheetApp.openById(config.spreadsheetId).getSheetByName('Responses');
    if(!sheet)throw new Error('Complete consolidation before setup validation.');
    checkHeaders_(sheet,backendHeaders_());
    console.log('Unified Responses verified. Columns: 215. Versions: 2.2, 2.3. No cells changed.');
    return {columns:215,mutated:false};
  }finally{lock.releaseLock();}
}
function selectWriteDestination_(book,version) {
  const unified=book.getSheetByName('Responses');
  if(headerMatches_(unified,backendHeaders_()))return {sheet:unified,unified:true,headers:backendHeaders_()};
  // A populated or 215-column malformed target is a configuration error, not a fallback trigger.
  if(unified&&(unified.getLastRow()>1||unified.getLastColumn()===215))throw new Error('Invalid unified destination');
  if(version!=='2.2')publicError_('The new survey version is not ready to collect responses yet. Please try again later.');
  const legacy=book.getSheetByName('Responses_v2_2'),headers=sourceHeaders_('2.2');
  if(!legacy)throw new Error('Missing legacy fallback destination');
  checkHeaders_(legacy,headers);
  return {sheet:legacy,unified:false,headers:headers};
}
function saveRecord_(config,record) {
  const lock=LockService.getScriptLock();
  lock.waitLock(BACKEND_SETTINGS.lockWaitMs);
  try {
    const book=SpreadsheetApp.openById(config.spreadsheetId);
    const destination=selectWriteDestination_(book,record.schemaVersion),sheet=destination.sheet;
    const digest=digest_(JSON.stringify({version:record.schemaVersion,answers:record.answers,planOrder:record.planOrder}));
    if(sheet.getLastRow()>1){
      const match=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(record.responseId).matchEntireCell(true).findNext();
      if(match){
        const existing=sheet.getRange(match.getRow(),1,1,7).getDisplayValues()[0];
        if(existing[6]!==digest)publicError_('This response identifier has already been used with different answers. Your earlier response has not been changed.');
        return {submissionId:record.responseId,receivedAt:existing[1],duplicate:true};
      }
    }
    const receivedAt=new Date().toISOString(),flat=destination.unified?unionFlat_(record):record.flat;
    const values=[record.responseId,receivedAt,record.schemaVersion,record.startedAt,record.completedAt,record.planOrder.join('|'),digest]
      .concat(destination.headers.slice(7).map(function(key){return flat[key]==null?'':flat[key];}));
    writeLiteralRow_(sheet,sheet.getLastRow()+1,values);
    SpreadsheetApp.flush();
    return {submissionId:record.responseId,receivedAt:receivedAt,duplicate:false};
  }finally{lock.releaseLock();}
}
// Pure mapping: preserves every existing cell, digest and version without interpreting answers.
function mapSourceRowToUnion_(sourceHeaders,sourceRow) {
  if(!Array.isArray(sourceHeaders)||!Array.isArray(sourceRow))throw new Error('Migration expects arrays');
  const version=sourceRow[sourceHeaders.indexOf('survey_version')],expected=sourceHeaders_(version);
  if(JSON.stringify(sourceHeaders)!==JSON.stringify(expected)||sourceRow.length!==expected.length)throw new Error('Source headers/width mismatch');
  const byHeader={};
  sourceHeaders.forEach(function(field,index){byHeader[field]=sourceRow[index];});
  if(!byHeader.submission_id||!byHeader.payload_sha256)throw new Error('Source row missing identity or digest');
  return UNIFIED_HEADERS_.map(function(field){
    return Object.prototype.hasOwnProperty.call(byHeader,field)?byHeader[field]:(field.endsWith('__asked')?'0':'');
  });
}
function dataRows_(sheet,width) {
  if(sheet.getLastRow()<2)return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,width).getDisplayValues()
    .filter(function(row){return row.some(function(cell){return cell!=='';});});
}
function requireUniqueRows_(rows,allowedVersions) {
  const seen=new Set();
  rows.forEach(function(row){
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row[0])||
       !allowedVersions.includes(row[2])||!/^[0-9a-f]{64}$/.test(row[6])||seen.has(row[0]))
      throw new Error('Source data identity/version/digest requires review');
    seen.add(row[0]);
  });
}
function writeMigrationRows_(sheet,rows) {
  // RichText writes literal strings; do not add a second CSV-safety apostrophe to old data.
  for(let start=0;start<rows.length;start+=250){
    const batch=rows.slice(start,start+250).map(function(row){return row.map(function(cell){
      return SpreadsheetApp.newRichTextValue().setText(String(cell==null?'':cell)).build();
    });});
    sheet.getRange(start+1,1,batch.length,215).setRichTextValues(batch);
  }
}
// Manual initial migration. Never deletes a sheet or modifies any source response cell.
// Failed staging tables are left intact for owner inspection and later cleanup.
function consolidateResponses() {
  const config=backendConfig_(),lock=LockService.getScriptLock();
  lock.waitLock(BACKEND_SETTINGS.lockWaitMs);
  try {
    const book=SpreadsheetApp.openById(config.spreadsheetId);
    const old21=book.getSheetByName('Responses_v2_1');
    if(old21&&old21.getLastRow()>1)throw new Error('Version 2.1 contains data; migration stopped without modifying source tables');
    const current=book.getSheetByName('Responses');
    const alreadyUnified=headerMatches_(current,backendHeaders_());
    if(current&&!alreadyUnified&&current.getLastRow()>1)throw new Error('Legacy Responses contains data; migration stopped without modifying source tables');
    const old22=book.getSheetByName('Responses_v2_2');
    let sourceRows=[];
    if(old22){
      checkHeaders_(old22,sourceHeaders_('2.2'));
      sourceRows=dataRows_(old22,203);requireUniqueRows_(sourceRows,['2.2']);
    }else if(!alreadyUnified)throw new Error('Version 2.2 source is missing');
    const mapped=sourceRows.map(function(row){return mapSourceRowToUnion_(sourceHeaders_('2.2'),row);});
    if(alreadyUnified){
      const existing=dataRows_(current,215);requireUniqueRows_(existing,['2.2','2.3']);
      const byId={};existing.forEach(function(row){byId[row[0]]=row;});
      mapped.forEach(function(row){if(JSON.stringify(byId[row[0]])!==JSON.stringify(row))throw new Error('Unified table does not exactly contain the source row; manual review required');});
      console.log('Consolidation already complete. Source rows: '+sourceRows.length+'. Unified rows: '+existing.length+'. No cells changed.');
      return {alreadyComplete:true,sourceRows:sourceRows.length,unifiedRows:existing.length,mutated:false};
    }
    const token=Utilities.getUuid().replace(/-/g,'').slice(0,20);
    const stage=book.insertSheet('Responses_Union_Staging_'+token);
    if(stage.getMaxColumns()<215)stage.insertColumnsAfter(stage.getMaxColumns(),215-stage.getMaxColumns());
    const desired=[backendHeaders_()].concat(mapped);
    writeMigrationRows_(stage,desired);stage.setFrozenRows(1);SpreadsheetApp.flush();
    if(stage.getLastRow()!==desired.length||stage.getLastColumn()!==215||
       JSON.stringify(stage.getRange(1,1,desired.length,215).getDisplayValues())!==JSON.stringify(desired))
      throw new Error('Staging readback verification failed; sources remain unchanged');
    // Recheck sources immediately before promotion, also catching external manual edits.
    if(old22&&JSON.stringify(dataRows_(old22,203))!==JSON.stringify(sourceRows))throw new Error('Source changed during migration; sources remain unchanged');
    if(current&&current.getLastRow()>1)throw new Error('Legacy destination changed during migration; sources remain unchanged');
    if(old21&&old21.getLastRow()>1)throw new Error('Version 2.1 changed during migration; sources remain unchanged');
    if(current)current.setName('Responses_Empty_ArchivePending_'+token);
    stage.setName('Responses');
    SpreadsheetApp.flush();
    console.log('Consolidation complete. Source rows: '+sourceRows.length+'. Unified rows: '+mapped.length+'. Source tables preserved.');
    return {alreadyComplete:false,sourceRows:sourceRows.length,unifiedRows:mapped.length,mutated:true,sourceTablesPreserved:true};
  }finally{lock.releaseLock();}
}

