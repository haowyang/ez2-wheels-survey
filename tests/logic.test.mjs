import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {allQuestions, expandedQuestions, conditionMet, cleanAnswers, validateItem, validateAll, orderedOptions, shuffledPlans, makeRecord, recordsToCsv, verifyImportedRecord, otherKey} from '../logic.mjs';
const schema=JSON.parse(await readFile(new URL('../survey.json',import.meta.url),'utf8'));
const metadata={responseId:'11111111-1111-4111-a111-111111111111',startedAt:'2026-10-19T10:00:00.000Z',completedAt:'2026-10-19T10:05:00.000Z',planOrder:[3,1,2]};
function filled(overrides={}){
  let answers={Q1:1,Q12:1,Q15_S:2,Q15_B:2,Q22:1,Q27_S:1,Q27_B:1,...overrides};
  for(let i=0;i<3;i++)for(const {q,key} of expandedQuestions(schema,answers)){
    if(Object.hasOwn(answers,key))continue;
    const type=q.type.replace('product_','');
    answers[key]=type==='multi'?[q.options[0].value]:type==='text'?(q.required?'Test university':''):type==='single'?q.options[0].value:q.min??0;
  }
  return cleanAnswers(schema,answers);
}
test('schema has 33 unique questions and complete scale endpoints',()=>{
  const questions=allQuestions(schema);assert.equal(questions.length,33);assert.equal(new Set(questions.map(q=>q.id)).size,33);
  for(const q of questions.filter(q=>q.type.endsWith('scale')))assert.deepEqual(q.options.map(o=>o.value),Array.from({length:q.max-q.min+1},(_,i)=>q.min+i));
});
test('all 576 combinations of interests, experience, charging and plans validate',()=>{
  let count=0;
  for(const S of [1,2,5])for(const B of [1,2,5])for(const exp of [1,2])for(const charge of [1,2])for(const sPlan of [1,2,3,4])for(const bPlan of [1,2,3,4]){
    const answers=filled({Q15_S:S,Q15_B:B,Q12:exp,Q22:charge,Q27_S:sPlan,Q27_B:bPlan});assert.deepEqual(validateAll(schema,answers),[]);const r=makeRecord(schema,answers,metadata);
    assert.equal(r.asked.Q24_S,S>=2);assert.equal(r.asked.Q24_B,B>=2);assert.equal(r.asked.Q30,S>=2||B>=2);assert.equal(r.asked.Q23,charge>=2);assert.equal(r.asked.Q13,exp>=2);assert.equal(r.asked.Q28_S,S>=2&&sPlan<=3);assert.equal(r.asked.Q29_B,B>=2&&bPlan===4);count++;
  }
  assert.equal(count,576);
});
test('ineligible response clears everything after the screener',()=>{assert.deepEqual(cleanAnswers(schema,{...filled(),Q1:0}),{Q1:0});assert.deepEqual(validateAll(schema,{Q1:0}),[]);});
test('returning to change interest clears descendants and retains all-respondent attitudes',()=>{
  const old=filled({Q27_S:1,Q27_B:4}),next=cleanAnswers(schema,{...old,Q15_S:1,Q15_B:1});
  for(const key of ['Q16_S','Q24_S','Q27_S','Q28_S','Q29_B','Q30','Q31','Q32'])assert.equal(Object.hasOwn(next,key),false,key);
  for(const key of ['Q18','Q19_S','Q19_B','Q20_S','Q21_B','Q22','Q33'])assert.ok(Object.hasOwn(next,key),key);
});
test('switching None to a plan clears rejection reasons and their text',()=>{
  const old=filled({Q27_S:4,Q29_S:[3,6],Q29_S__3_text:'A weekly plan',Q29_S__6_text:'Other reason'});
  assert.equal(validateAll(schema,old).length,0);
  const next=cleanAnswers(schema,{...old,Q27_S:2});assert.equal(next.Q29_S,undefined);assert.equal(next.Q29_S__3_text,undefined);assert.equal(next.Q29_S__6_text,undefined);assert.ok(validateAll(schema,next).some(e=>e.key==='Q28_S'));
});
test('deselecting Other clears hidden free text and only selected Other is required',()=>{
  const answers=filled({Q8:[8],Q8__8_text:''});assert.ok(validateAll(schema,answers).some(e=>e.key==='Q8__8_text'));
  const next=cleanAnswers(schema,{...answers,Q8:[1]});assert.equal(next.Q8__8_text,undefined);assert.equal(validateAll(schema,next).length,0);
});
test('0 remains a real response; hidden values export blank with asked=0',()=>{
  const r=makeRecord(schema,filled({Q15_S:1,Q15_B:2,Q16_B:0,Q24_B:0,Q26:0,Q30:0,Q31:0}),metadata);
  assert.equal(r.flat.V_Q16_S,'');assert.equal(r.flat.V_Q16_S__asked,0);assert.equal(r.flat.V_Q16_B,0);assert.equal(r.flat.V_Q16_B__asked,1);assert.equal(r.flat.V_Q24_B,0);
});
test('export contains exactly the 98 declared variables plus 98 asked indicators',()=>{
  const r=makeRecord(schema,filled(),metadata),expected=allQuestions(schema).flatMap(q=>q.exportFields);
  assert.equal(expected.length,98);assert.deepEqual(Object.keys(r.flat).filter(k=>!k.endsWith('__asked')).sort(),expected.sort());assert.equal(Object.keys(r.flat).length,196);
});
test('multi choice export is binary for asked choices and blank for hidden choices',()=>{
  const r=makeRecord(schema,filled({Q8:[1,4],Q15_S:1,Q15_B:1}),metadata);assert.equal(r.flat.V_Q8_1,1);assert.equal(r.flat.V_Q8_2,0);assert.equal(r.flat.V_Q28_1_S,'');assert.equal(r.flat.V_Q28_1_S__asked,0);
});
test('numeric validation rejects missing, out-of-range, fractional and excessive decimal values',()=>{
  const q=id=>allQuestions(schema).find(q=>q.id===id);
  for(const value of ['',-1,8,2.5,false,{},'1e2'])assert.ok(validateItem(q('Q7'),'Q7',{Q7:value}).length,String(value));
  assert.equal(validateItem(q('Q7'),'Q7',{Q7:0}).length,0);assert.ok(validateItem(q('Q6'),'Q6',{Q6:1.23}).length);assert.ok(validateItem(q('Q11'),'Q11',{Q11:1.234}).length);
  assert.ok(validateItem(q('Q1'),'Q1',{Q1:[1]}).length);
});
test('randomization keeps codes stable and None last',()=>{
  const q=allQuestions(schema).find(q=>q.id==='Q27');assert.deepEqual(orderedOptions(q,[3,1,2]).map(o=>o.value),[3,1,2,4]);assert.deepEqual(shuffledPlans(()=>0).sort(),[1,2,3]);
});
test('CSV escapes commas, quotes, newline and formula-like text',()=>{
  const r=makeRecord(schema,filled({Q2:'=HYPERLINK("x")',Q33:'a,b\n"c"'}),metadata),csv=recordsToCsv([r]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('"a,b\n""c"""'));assert.ok(csv.includes('response_id,schema_version'));
});
test('import rejects wrong version, malformed metadata, invalid answers and rebuilds flat values',()=>{
  const record=makeRecord(schema,filled(),metadata);assert.throws(()=>verifyImportedRecord(schema,{...record,schemaVersion:'1'}));assert.throws(()=>verifyImportedRecord(schema,{...record,responseId:'x'}));assert.throws(()=>verifyImportedRecord(schema,{...record,answers:{...record.answers,Q7:8}}));assert.throws(()=>verifyImportedRecord(schema,{...record,answers:{Q1:0}}));assert.equal(verifyImportedRecord(schema,{...record,flat:{V_Q1:0}}).flat.V_Q1,1);
});
