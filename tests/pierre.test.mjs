import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  allQuestions, expandedQuestions, conditionMet, cleanAnswers, validateItem,
  validateAll, makeRecord, recordsToCsv, verifyImportedRecord, otherKey
} from '../logic.mjs';

const schema = JSON.parse(await readFile(new URL('../survey.json', import.meta.url), 'utf8'));
const source = JSON.parse(await readFile(new URL('./fixtures/pierre-survey.json', import.meta.url), 'utf8'));
const questions = allQuestions(schema);
const qById = id => questions.find(q => q.id === id);
const metadata = {
  responseId:'22222222-2222-4222-8222-222222222222',
  startedAt:'2026-10-20T16:00:00.000Z', completedAt:'2026-10-20T16:05:00.000Z',
  planOrder:[2,3,1]
};
function filled(overrides = {}) {
  const answers = {Q1:1,Q12:2,Q16_S:5,Q16_B:5,Q22:5,Q27_S:1,Q27_B:1,...overrides};
  for(let pass=0;pass<4;pass++) for(const {q,key} of expandedQuestions(schema,answers)) {
    if(Object.hasOwn(answers,key)) continue;
    const type=q.type.replace('product_','');
    answers[key]=type==='multi'?[q.options[0].value]:type==='text'?(q.required?'Offline test university':''):
      type==='single'?q.options[0].value:q.min??0;
  }
  return cleanAnswers(schema,answers);
}

test('Pierre source is preserved question by question; only version and Q6 missing metadata differ', () => {
  assert.equal(schema.version,'2.2');
  assert.equal(source.version,'2.1');
  const actual=structuredClone(schema), expected=structuredClone(source);
  actual.version=expected.version;
  for(const q of allQuestions(actual)) {
    if(q.id==='Q6') {
      assert.deepEqual(q.missingValues,[99]);
      delete q.missingValues;
    }
    assert.deepEqual(q,allQuestions(expected).find(item=>item.id===q.id),q.id);
  }
  assert.deepEqual(actual,expected,'Intro, products, pricing, sections, types, codes and text must remain exact');
});

test('all 33 questions, codes, conditions and 98 field mappings are unique and internally complete', () => {
  assert.equal(questions.length,33);
  for(const key of ['id','number','variable']) assert.equal(new Set(questions.map(q=>q[key])).size,33,key);
  const fields=questions.flatMap(q=>q.exportFields);
  assert.equal(fields.length,98); assert.equal(new Set(fields).size,98);
  const conditions=new Set(['always','eligible','experienced','any_interest','charger_interest',
    ...['S','B'].flatMap(p=>['interested','uninterested','chose_plan','chose_none'].map(c=>`${c}_${p}`))]);
  for(const q of questions) {
    assert.equal(q.id,`Q${q.number}`); assert.equal(q.variable,`V_${q.id}`);
    assert.equal(new Set(q.options.map(o=>String(o.value))).size,q.options.length,q.id);
    for(const condition of [q.condition,...Object.values(q.productConditions||{})])
      for(const part of condition.split('||')) assert.ok(conditions.has(part.trim()),`${q.id}: ${part}`);
    const expected=[];
    for(const product of q.products||[null]) {
      const suffix=product?`_${product}`:'';
      if(q.type.replace('product_','')==='multi') expected.push(...q.options.map(o=>`${q.variable}_${o.value}${suffix}`));
      else expected.push(`${q.variable}${suffix}`);
      for(const option of q.options.filter(o=>o.other)) expected.push(product?option.otherFields[product]:option.otherField);
    }
    assert.deepEqual(q.exportFields,expected,q.id);
  }
});

// Each question is checked independently of whether a particular branch displays it.
// Both products, every declared option, missing values, malformed values and numeric
// boundaries are covered; branch-aware requiredness is checked separately below.
for(const q of questions) test(`${q.id}: valid choices, invalid values, requiredness and Other text`, () => {
  const type=q.type.replace('product_','');
  for(const product of q.products||[null]) {
    const key=q.id+(product?`_${product}`:'');
    function check(value,details={}) { return validateItem(q,key,{[key]:value,...details}); }
    for(const value of [undefined,null,'']) assert.equal(check(value).length>0,q.required,`${key} empty`);
    let validValues=[];
    if(type==='single'||type==='scale') validValues=q.options.map(o=>o.value);
    if(type==='multi') validValues=[...q.options.map(o=>[o.value]),q.options.map(o=>o.value)];
    if(type==='number') validValues=[q.min??0,q.max??20];
    if(type==='number' && q.decimals>0) validValues.push((q.min??0)+0.5);
    if(type==='text') validValues=['An answer','x'.repeat(q.maxLength)];
    for(const value of validValues) {
      const details={};
      for(const option of q.options.filter(o=>o.other)) details[otherKey(key,option)]='A specific explanation';
      assert.deepEqual(check(value,details),[],`${key} valid ${JSON.stringify(value)}`);
      if(['single','scale','number'].includes(type)) assert.deepEqual(check(String(value),details),[],`${key} string code`);
    }
    let invalidValues=[{},true,false];
    if(type==='single') invalidValues.push([], [q.options[0].value], '__invalid__',-999,1.5);
    if(type==='multi') invalidValues.push([],q.options[0].value,'__invalid__',[-999],[q.options[0].value,q.options[0].value]);
    if(type==='number'||type==='scale') {
      invalidValues.push([], [0], NaN, Infinity, 'not a number', '1e2', (q.min??0)-1);
      if(q.max!==undefined) invalidValues.push(q.max+1);
      invalidValues.push((q.min??0)+(q.decimals===0||type==='scale'?0.5:0.001));
    }
    if(type==='text') invalidValues.push(1,[],['text'],'x'.repeat(q.maxLength+1));
    for(const value of invalidValues) assert.ok(check(value).length,`${key} rejects ${JSON.stringify(value)}`);
    for(const option of q.options.filter(o=>o.other)) {
      const value=type==='multi'?[option.value]:option.value, detail=otherKey(key,option);
      for(const text of [undefined,null,'','   ']) assert.ok(check(value,{[detail]:text}).some(e=>e.key===detail),detail);
      assert.deepEqual(check(value,{[detail]:'x'.repeat(option.otherMaxLength)}),[],detail);
      for(const text of ['x'.repeat(option.otherMaxLength+1),{},1]) assert.ok(check(value,{[detail]:text}).some(e=>e.key===detail),detail);
      const normal=q.options.find(o=>!o.other).value;
      assert.deepEqual(check(type==='multi'?[normal]:normal,{[detail]:''}),[],`${detail} unselected`);
    }
  }
});

test('every visible required answer prevents completion when removed; Q33 remains optional', () => {
  const covered=new Set();
  for(const overrides of [{},{Q16_S:1,Q16_B:1},{Q27_S:4,Q27_B:4}]) {
    const answers=filled(overrides);
    assert.deepEqual(validateAll(schema,answers),[]);
    for(const {q,key} of expandedQuestions(schema,answers)) {
      covered.add(q.id);
      const missing={...answers}; delete missing[key];
      const errors=validateAll(schema,missing);
      assert.equal(errors.some(e=>e.key===key),q.required,key);
      if(q.required) assert.throws(()=>makeRecord(schema,missing,metadata),/invalid field/);
      else assert.doesNotThrow(()=>makeRecord(schema,missing,metadata));
    }
  }
  assert.equal(covered.size,33);
});

test('Q6 preserves Pierre distance bands and explicit NA for all eligible respondents', () => {
  const q=qById('Q6');
  assert.deepEqual(q.options.map(o=>o.value),[1,2,3,4,5,99]);
  assert.deepEqual(q.options.map(o=>o.label),['Less than 0.5 miles','0.5 to less than 1 mile',
    '1 to less than 2 miles','2 to less than 3 miles','3–5 miles','NA']);
  assert.equal(q.condition,'eligible'); assert.equal(q.required,true);
  for(const living of [1,2,3]) {
    assert.ok(expandedQuestions(schema,filled({Q5:living})).some(item=>item.key==='Q6'));
    for(const value of [1,5,99]) assert.deepEqual(validateAll(schema,filled({Q5:living,Q6:value})),[]);
  }
  assert.ok(validateItem(q,'Q6',{Q6:6}).length,'old >5 code must not be accepted');
});

test('Q6 NA remains raw 99 while analysis exports blank and asked=1; distance codes remain unchanged', () => {
  for(const input of [99,'99']) {
    const r=makeRecord(schema,filled({Q5:2,Q6:input}),metadata);
    assert.equal(r.answers.Q6,input); assert.equal(r.asked.Q6,true);
    assert.equal(r.flat.V_Q6,''); assert.equal(r.flat.V_Q6__asked,1);
    const csv=recordsToCsv([r]).trim().replace(/^\uFEFF/,'').split('\r\n');
    const headers=csv[0].split(','), values=csv[1].split(',');
    assert.equal(values[headers.indexOf('V_Q6')],'');
    assert.equal(values[headers.indexOf('V_Q6__asked')],'1');
    const restored=verifyImportedRecord(schema,{...r,flat:{V_Q6:99,V_Q6__asked:0}});
    assert.equal(restored.answers.Q6,input); assert.equal(restored.flat.V_Q6,''); assert.equal(restored.flat.V_Q6__asked,1);
  }
  for(const distance of [1,2,3,4,5]) {
    const r=makeRecord(schema,filled({Q6:distance}),metadata);
    assert.equal(r.flat.V_Q6,distance); assert.equal(r.flat.V_Q6__asked,1);
  }
  const screened=makeRecord(schema,{Q1:0},metadata);
  assert.equal(screened.flat.V_Q6,''); assert.equal(screened.flat.V_Q6__asked,0);
});

test('experienced means precisely a valid Q12 code other than Never', () => {
  for(const value of [2,3,4,5,'2','3','4','5']) {
    assert.equal(conditionMet('experienced',{Q1:1,Q12:value}),true,JSON.stringify(value));
    assert.equal(conditionMet('experienced',{Q1:0,Q12:value}),false,'ineligible');
    const r=makeRecord(schema,filled({Q12:value}),metadata);
    assert.equal(r.asked.Q13,true); assert.equal(r.asked.Q14,true);
  }
  for(const value of [undefined,null,'',1,'1',0,6,99,2.5,'2.5',[2],{},true,false,NaN,Infinity])
    assert.equal(conditionMet('experienced',{Q1:1,Q12:value}),false,JSON.stringify(value));
});

test('changing experience to Never removes location/reliability and their Other text', () => {
  const answers=filled({Q12:2,Q13:[4],Q13__4_text:'Other city',Q14:5});
  assert.deepEqual(validateAll(schema,answers),[]);
  const cleaned=cleanAnswers(schema,{...answers,Q12:1});
  for(const key of ['Q13','Q13__4_text','Q14']) assert.equal(Object.hasOwn(cleaned,key),false,key);
  const r=makeRecord(schema,cleaned,metadata);
  for(const field of [...qById('Q13').exportFields,...qById('Q14').exportFields]) {
    assert.equal(r.flat[field],''); assert.equal(r.flat[`${field}__asked`],0);
  }
  const experiencedAgain=cleanAnswers(schema,{...cleaned,Q12:3});
  for(const id of ['Q13','Q14']) assert.ok(validateAll(schema,experiencedAgain).some(e=>e.key===id));
});

test('every conditional Other field exports only while selected and is cleared on deselection', () => {
  for(const q of questions.filter(q=>q.options.some(o=>o.other))) for(const product of q.products||[null]) {
    const key=q.id+(product?`_${product}`:''), overrides={};
    if(q.id==='Q13') overrides.Q12=2;
    if(q.id==='Q17') overrides[`Q16_${product}`]=1;
    if(q.id==='Q28') overrides[`Q27_${product}`]=1;
    if(q.id==='Q29') overrides[`Q27_${product}`]=4;
    for(const option of q.options.filter(o=>o.other)) {
      const detail=otherKey(key,option), field=product?option.otherFields[product]:option.otherField;
      const answers=filled({...overrides,[key]:[option.value],[detail]:'Other explanation'});
      const r=makeRecord(schema,answers,metadata);
      assert.equal(r.flat[field],'Other explanation'); assert.equal(r.flat[`${field}__asked`],1);
      const next=cleanAnswers(schema,{...answers,[key]:[q.options.find(o=>!o.other).value]});
      assert.equal(Object.hasOwn(next,detail),false,detail);
      const r2=makeRecord(schema,next,metadata);
      assert.equal(r2.flat[field],''); assert.equal(r2.flat[`${field}__asked`],0);
    }
  }
});
