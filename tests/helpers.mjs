import {readFile} from 'node:fs/promises';
import {allQuestions,expandedQuestions,cleanAnswers} from '../logic.mjs';
export const schema=JSON.parse(await readFile(new URL('../survey.json',import.meta.url),'utf8'));
export const questions=allQuestions(schema);
export const question=id=>questions.find(q=>q.id===id);
export const metadata={responseId:'11111111-1111-4111-a111-111111111111',startedAt:'2026-10-23T12:00:00.000Z',completedAt:'2026-10-23T12:05:00.000Z',planOrder:[3,1,2]};
export function filled(overrides={}) {
  const answers={Q1:1,Q13:1,Q17_S:0,Q17_B:10,Q18_S:5,Q18_B:5,Q26_S:1,Q26_B:1,Q29:5,...overrides};
  for(let pass=0;pass<4;pass++)for(const {q,key} of expandedQuestions(schema,answers)) {
    if(Object.hasOwn(answers,key))continue;
    const type=q.type.replace('product_','');
    answers[key]=type==='multi'?[q.options[0].value]:type==='text'?(q.required?'Offline test university':''):type==='single'?q.options[0].value:q.min??0;
  }
  return cleanAnswers(schema,answers);
}
