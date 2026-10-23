import test from 'node:test';
import assert from 'node:assert/strict';
import {schema,questions,question,metadata,filled} from './helpers.mjs';
import {conditionMet,expandedQuestions,cleanAnswers,validateItem,validateAll,orderedOptions,shuffledPlans,makeRecord,recordsToCsv,verifyImportedRecord,otherKey} from '../logic.mjs';

test('all 1600 interest, experience, charger and plan combinations validate and route correctly',()=>{
  let count=0;
  for(const S of [1,2,3,4,5])for(const B of [1,2,3,4,5])for(const experience of [0,1])for(const charge of [1,5])for(const sPlan of [1,2,3,4])for(const bPlan of [1,2,3,4]){
    const a=filled({Q18_S:S,Q18_B:B,Q13:experience,Q29:charge,Q26_S:sPlan,Q26_B:bPlan});
    assert.deepEqual(validateAll(schema,a),[]);const r=makeRecord(schema,a,metadata);
    for(const key of ['Q14','Q15','Q16'])assert.equal(r.asked[key],experience===1,key);
    for(const key of ['Q17_S','Q17_B','Q18_S','Q18_B','Q20','Q21_S','Q21_B','Q22_S','Q22_B','Q23_S','Q23_B','Q12','Q29','Q31','Q33'])assert.equal(r.asked[key],true,key);
    for(const [p,interest,plan] of [['S',S,sPlan],['B',B,bPlan]]){
      assert.equal(r.asked['Q19_'+p],interest===1);
      for(const id of ['Q25','Q26'])assert.equal(r.asked[id+'_'+p],interest>1);
      assert.equal(r.asked['Q27_'+p],interest>1&&plan<=3);
      assert.equal(r.asked['Q28_'+p],interest>1&&plan===4);
    }
    for(const key of ['Q24','Q32'])assert.equal(r.asked[key],S>1||B>1,key);
    assert.equal(r.asked.Q30,charge>1);count++;
  }
  assert.equal(count,1600);
});

test('routing accepts only valid scalar codes for Q1, Q13, Q18, Q26 and Q29',()=>{
  for(const value of [1,'1'])assert.equal(conditionMet('experienced',{Q1:1,Q13:value}),true);
  for(const value of [undefined,null,'',0,2,5,99,1.5,[1],{},true,false,NaN,Infinity])assert.equal(conditionMet('experienced',{Q1:1,Q13:value}),false,JSON.stringify(value));
  for(const value of [2,3,4,5,'2','3','4','5']){
    assert.equal(conditionMet('interested_S',{Q1:1,Q18_S:value}),true);
    assert.equal(conditionMet('charger_interest',{Q1:1,Q29:value}),true);
  }
  for(const value of [undefined,null,'',0,6,99,2.5,[2],{},true,false,NaN,Infinity]){
    assert.equal(conditionMet('interested_S',{Q1:1,Q18_S:value}),false);
    assert.equal(conditionMet('charger_interest',{Q1:1,Q29:value}),false);
  }
  for(const value of [[1],{},true,false,0,null])assert.equal(conditionMet('eligible',{Q1:value}),false);
  for(const value of [[1],[4],{},true,2.5])for(const condition of ['chose_plan_S','chose_none_S'])assert.equal(conditionMet(condition,{Q1:1,Q18_S:5,Q26_S:value}),false);
  for(const condition of Object.keys(schema.conditionDefinitions).filter(c=>c!=='always'))assert.equal(conditionMet(condition,{Q1:0,Q13:1,Q18_S:5,Q18_B:5,Q26_S:1,Q26_B:4,Q29:5}),false,condition);
  assert.throws(()=>conditionMet('unknown',{Q1:1}),/Unknown/);
});

test('ineligible answers clear every downstream value and are not importable completed responses',()=>{
  assert.deepEqual(cleanAnswers(schema,{...filled(),Q1:0}),{Q1:0});
  assert.deepEqual(validateAll(schema,{Q1:0}),[]);
  const r=makeRecord(schema,{Q1:0},metadata);assert.throws(()=>verifyImportedRecord(schema,r),/eligible/);
});

test('changing experience clears payment, locations, reliability and Other text',()=>{
  const a=filled({Q15:[4],Q15__4_text:'Another setting'});
  const next=cleanAnswers(schema,{...a,Q13:0});
  for(const key of ['Q14','Q15','Q16','Q15__4_text'])assert.equal(next[key],undefined,key);
  const r=makeRecord(schema,next,metadata);
  for(const field of ['Q14','Q15','Q16'].flatMap(id=>question(id).exportFields)){assert.equal(r.flat[field],'');assert.equal(r.flat[field+'__asked'],0);}
});

test('changing interest clears only hidden descendants and retains general attitudes, budget and charging',()=>{
  const next=cleanAnswers(schema,{...filled({Q26_B:4,Q28_B:[6],Q28_B__6_text:'Other reason'}),Q18_S:1,Q18_B:1});
  for(const key of ['Q24','Q25_S','Q25_B','Q26_S','Q26_B','Q27_S','Q28_B','Q28_B__6_text','Q32'])assert.equal(next[key],undefined,key);
  for(const key of ['Q12','Q17_S','Q17_B','Q18_S','Q18_B','Q20','Q21_S','Q22_B','Q23_S','Q29','Q30','Q31','Q33'])assert.ok(Object.hasOwn(next,key),key);
  assert.ok(validateAll(schema,next).some(e=>e.key==='Q19_S'));
});

test('switching a plan or charging answer removes stale reasons and compensation',()=>{
  const a=filled({Q26_S:4,Q28_S:[3,6],Q28_S__3_text:'A weekly plan',Q28_S__6_text:'Other reason'});
  const next=cleanAnswers(schema,{...a,Q26_S:2,Q29:1});
  for(const key of ['Q28_S','Q28_S__3_text','Q28_S__6_text','Q30'])assert.equal(next[key],undefined,key);
  assert.ok(validateAll(schema,next).some(e=>e.key==='Q27_S'));
});

test('liking never controls interest routes, including lowest liking with highest interest',()=>{
  for(const s of [0,1,10])for(const b of [0,1,10])for(const S of [1,5])for(const B of [1,5]){
    const r=makeRecord(schema,filled({Q17_S:s,Q17_B:b,Q18_S:S,Q18_B:B}),metadata);
    assert.equal(r.flat.V_Q17_S,s);assert.equal(r.flat.V_Q17_B,b);
    assert.equal(r.asked.Q19_S,S===1);assert.equal(r.asked.Q19_B,B===1);
    assert.equal(r.asked.Q26_S,S===5);assert.equal(r.asked.Q26_B,B===5);
  }
});

test('Q24 combined usage is one field and zero does not force pricing skips',()=>{
  assert.equal(question('Q24').type,'single');assert.deepEqual(question('Q24').exportFields,['V_Q24_band']);
  const r=makeRecord(schema,filled({Q24:0,Q12:0,Q25_S:1}),metadata);
  assert.equal(r.flat.V_Q24_band,0);assert.equal(r.flat.V_Q24_band__asked,1);
  assert.equal(r.asked.Q26_S,true);assert.equal(r.asked.Q26_B,true);
  assert.equal(r.asked.Q24_S,undefined);assert.equal(r.asked.Q24_B,undefined);
});

test('every Other field is required, exported and removed for both scalar and multiple choice',()=>{
  for(const q of questions.filter(q=>q.options.some(o=>o.other)))for(const p of q.products||[null])for(const option of q.options.filter(o=>o.other)){
    const key=q.id+(p?'_'+p:''),detail=otherKey(key,option),field=p?option.otherFields[p]:option.otherField;
    const override=q.id==='Q19'?{['Q18_'+p]:1}:q.id==='Q28'?{['Q26_'+p]:4}:{};
    const selected=q.type.endsWith('multi')?[option.value]:option.value;
    const a=filled({...override,[key]:selected,[detail]:'A specific explanation'});
    const r=makeRecord(schema,a,metadata);assert.equal(r.flat[field],'A specific explanation');assert.equal(r.flat[field+'__asked'],1);
    const missing={...a};delete missing[detail];assert.ok(validateAll(schema,missing).some(e=>e.key===detail));
    const normal=q.options.find(o=>!o.other).value;
    const next=cleanAnswers(schema,{...a,[key]:q.type.endsWith('multi')?[normal]:normal});assert.equal(next[detail],undefined);
    const r2=makeRecord(schema,next,metadata);assert.equal(r2.flat[field],'');assert.equal(r2.flat[field+'__asked'],0);
  }
});

test('export has exactly 98 values plus 98 asked indicators; off-campus Q6 is absent with asked=0',()=>{
  const r=makeRecord(schema,filled({Q5:2,Q6:99,Q8:[1,4]}),metadata),fields=questions.flatMap(q=>q.exportFields);
  assert.equal(fields.length,98);assert.equal(Object.keys(r.flat).length,196);
  assert.deepEqual(Object.keys(r.flat).filter(k=>!k.endsWith('__asked')).sort(),[...fields].sort());
  assert.equal(r.answers.Q6,undefined);assert.equal(r.flat.V_Q6,'');assert.equal(r.flat.V_Q6__asked,0);
  assert.equal(r.flat.V_Q8_1,1);assert.equal(r.flat.V_Q8_2,0);assert.equal(r.flat.V_Q8_4,1);
  assert.equal(r.flat.V_Q8_9,undefined);
});

test('pricing randomization retains all stable codes and keeps None last',()=>{
  for(const order of [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]])assert.deepEqual(orderedOptions(question('Q26'),order).map(o=>o.value),[...order,4]);
  assert.deepEqual(shuffledPlans(()=>0).sort(),[1,2,3]);
  assert.deepEqual(orderedOptions(question('Q27'),[3,1,2]),question('Q27').options);
});

test('CSV escapes text and refuses mixed versions; imported exports are always recomputed',()=>{
  const r=makeRecord(schema,filled({Q2:'=HYPERLINK("x")',Q33:'a,b\n"c"'}),metadata);
  const csv=recordsToCsv([r]);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/'=HYPERLINK/);assert.ok(csv.includes('"a,b\n""c"""'));
  assert.throws(()=>recordsToCsv([r,{...r,schemaVersion:'2.4'}]),/different survey versions/);
  assert.equal(verifyImportedRecord(schema,{...r,flat:{V_Q1:0}}).flat.V_Q1,1);
  for(const bad of [{schemaVersion:'2.4'},{responseId:'x'},{planOrder:[1,1,3]},{startedAt:'invalid'},{answers:[]},{answers:{...r.answers,Q7:8}},{answers:{...r.answers,Q3:8}}])assert.throws(()=>verifyImportedRecord(schema,{...r,...bad}));
});
