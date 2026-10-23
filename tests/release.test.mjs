import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {schema,question,metadata,filled} from './helpers.mjs';
import {expandedQuestions,cleanAnswers,validateItem,validateAll,makeRecord,visibleProducts,updateMultiSelection} from '../logic.mjs';
import {questionsForSection,pricingOptionsHtml,SCREEN_OUT_TEXT} from '../presentation.mjs';
import {productIntroHtml} from '../product-intro.mjs';
import {conditionMet} from '../logic.mjs';
const keys=a=>expandedQuestions(schema,a).map(q=>q.key);

test('screenshot requirement 1: Q1 No ends the survey with both age and student eligibility explained',()=>{
  assert.deepEqual(keys({Q1:0}),['Q1']);assert.deepEqual(cleanAnswers(schema,{...filled(),Q1:0}),{Q1:0});
  assert.match(SCREEN_OUT_TEXT,/18 or older/);assert.match(SCREEN_OUT_TEXT,/currently enrolled/);assert.match(SCREEN_OUT_TEXT,/large public university in the U.S./);
});
test('screenshot requirement 2: Q13 No skips exactly experience follow-ups Q14–Q16',()=>{
  const a=filled({Q13:0});for(const id of ['Q14','Q15','Q16'])assert.equal(keys(a).includes(id),false);
  for(const id of ['Q13','Q17_S','Q17_B','Q18_S','Q18_B'])assert.equal(keys(a).includes(id),true,id);
});
test('screenshot requirement 3: only the product rated uninterested receives Q19',()=>{
  for(const [S,B,expected] of [[1,5,['S']],[5,1,['B']],[5,5,[]]])assert.deepEqual(visibleProducts(question('Q19'),filled({Q18_S:S,Q18_B:B})),expected);
});
test('updated requirement 4: two uninterested products skip Q24–Q28; Q31 and Q32 remain for all eligible students',()=>{
  const a=filled({Q18_S:1,Q18_B:1});
  for(const item of expandedQuestions(schema,a))assert.equal([24,25,26,27,28].includes(item.q.number),false,item.key);
  for(const id of ['Q19_S','Q19_B','Q20','Q21_S','Q21_B','Q22_S','Q22_B','Q23_S','Q23_B','Q29','Q30','Q31','Q32','Q33'])assert.ok(keys(a).includes(id),id);
});
test('screenshot requirement 5: plans 1–3 show Q27 and None 4 shows Q28 independently',()=>{
  for(const s of [1,2,3,4])for(const b of [1,2,3,4]){
    const a=filled({Q26_S:s,Q26_B:b});
    for(const [p,code] of [['S',s],['B',b]]){assert.equal(keys(a).includes('Q27_'+p),code<4);assert.equal(keys(a).includes('Q28_'+p),code===4);}
  }
});
test('screenshot requirement 6: Q29=1 skips Q30 and removes any prior compensation choice',()=>{
  const a=cleanAnswers(schema,{...filled(),Q29:1});assert.equal(a.Q30,undefined);assert.equal(keys(a).includes('Q30'),false);
});
test('screenshot requirement 7: Q3 scalar Other and Q8 multi Other require detail, export it, and clear it on change',()=>{
  for(const id of ['Q3','Q8']){
    const selected=id==='Q3'?8:[8],detail=id+'__8_text';
    assert.ok(validateAll(schema,filled({[id]:selected})).some(e=>e.key===detail));
    const a=filled({[id]:selected,[detail]:'Other answer'});assert.deepEqual(validateAll(schema,a),[]);
    assert.equal(makeRecord(schema,a,metadata).flat['V_'+id+'_Other_txt'],'Other answer');
    const next=cleanAnswers(schema,{...a,[id]:id==='Q3'?1:updateMultiSelection(question(id),a[id],8,false)});assert.equal(next[detail],undefined);
  }
});
test('screenshot requirement 8: each product price table uses only its exact prices and terms in the stable randomized order',()=>{
  const q=question('Q26'),order=[3,1,2];
  for(const p of ['S','B']){
    const html=pricingOptionsHtml(schema,q,p,'Q26_'+p,2,order);
    assert.deepEqual([...html.matchAll(/data-plan="(\d+)"/g)].map(m=>Number(m[1])),[3,1,2,4]);
    for(const plan of schema.plansByProduct[p]){assert.ok(html.includes(plan.price),p+' '+plan.price);assert.ok(html.includes(plan.description),p+' '+plan.description);}
    for(const plan of schema.plansByProduct[p==='S'?'B':'S'])assert.equal(html.includes(plan.price),false,'wrong product price '+plan.price);
    assert.equal((html.match(/type="radio"/g)||[]).length,4);assert.equal((html.match(/checked/g)||[]).length,1);
    assert.ok(html.includes('name="Q26_'+p+'"'));
  }
  for(const [S,B,expected] of [[1,1,[]],[5,1,['S']],[1,5,['B']],[5,5,['S','B']]])assert.deepEqual(visibleProducts(q,filled({Q18_S:S,Q18_B:B})),expected);
});

test('liking Q17 is visible first, then both Q18 interests, then applicable Q19 reasons',()=>{
  const section=schema.sections.find(s=>s.id==='interest');const visible=a=>questionsForSection(section,{Q1:1,...a}).map(q=>q.id);
  assert.deepEqual(visible({}),['Q17']);assert.deepEqual(visible({Q17_S:0}),['Q17']);
  assert.deepEqual(visible({Q17_S:0,Q17_B:10}),['Q17','Q18']);
  assert.deepEqual(visible({Q17_S:0,Q17_B:10,Q18_S:1}),['Q17','Q18']);
  assert.deepEqual(visible({Q17_S:0,Q17_B:10,Q18_S:1,Q18_B:5}),['Q17','Q18','Q19']);
});
test('both product descriptions use identical comparison columns and exact provided details',()=>{
  const html=productIntroHtml(schema.productIntro);
  assert.equal((html.match(/role="columnheader"/g)||[]).length,3);assert.equal((html.match(/role="cell"/g)||[]).length,6);
  for(const label of ['Pick-up','Return','Charging'])assert.ok(html.includes('>'+label+'</th>'));
  assert.match(html,/nearest available scooter anywhere on campus/);assert.match(html,/designated bike stand/);assert.match(html,/kept charged and ready to ride/);
  const hostile=productIntroHtml(['<img src=x>\n<script>: A & B','Bike\n<script>: <b>unsafe</b>']);
  assert.doesNotMatch(hostile,/<img|<script>|<b>/);assert.match(hostile,/&lt;img/);
  assert.ok(productIntroHtml(['Single line <safe>']).includes('&lt;safe&gt;'));
});
test('pricing text is HTML-escaped and missing per-product pricing fails instead of silently using combined prices',()=>{
  const data=structuredClone(schema);data.plansByProduct.S[0].price='<img src=x>';data.plansByProduct.S[0].description='A & B';
  const html=pricingOptionsHtml(data,question('Q26'),'S','Q26_S',1,[1,2,3]);assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.match(html,/A &amp; B/);
  assert.throws(()=>pricingOptionsHtml({...schema,plansByProduct:{}},question('Q26'),'S','Q26_S',1,[1,2,3]),/missing/);
});
test('all entry points load 3.3 resources and app uses tested presentation and cleanup functions',async()=>{
  for(const name of ['app.mjs','admin.mjs','index.html','admin.html','presentation.mjs']){
    const source=await readFile(new URL('../'+name,import.meta.url),'utf8');assert.doesNotMatch(source,/\?v=(?:2\.|3\.[12])/,name);assert.match(source,/\?v=3\.3/,name);
    if(name==='app.mjs'){
      assert.match(source,/questionsForSection\(section,state.answers\)/);assert.match(source,/pricingOptionsHtml\(schema,q,product,key,value,state.planOrder\)/);
      assert.match(source,/inputHtml\(q,keyFor\(q,p\),p\)/);assert.match(source,/state.answers=cleanAnswers\(schema,state.answers\)/);
      assert.match(source,/o.other&&chosen/);assert.match(source,/SCREEN_OUT_TEXT/);assert.doesNotMatch(source,/schema.plans.find/);
    }
  }
});

test('on_campus requires eligible status and exactly a valid scalar Q5=1',()=>{
  for(const eligible of [1,'1'])for(const living of [1,'1'])assert.equal(conditionMet('on_campus',{Q1:eligible,Q5:living}),true);
  for(const value of [undefined,null,'',0,2,3,99,1.5,[1],{},true,false,NaN,Infinity,'01'])assert.equal(conditionMet('on_campus',{Q1:1,Q5:value}),false,JSON.stringify(value));
  for(const value of [undefined,null,0,[1],true,2])assert.equal(conditionMet('on_campus',{Q1:value,Q5:1}),false);
});

test('Q5 moving off campus hides Q6, clears its old answer and exports blank with asked=0',()=>{
  for(const living of [2,3,'2','3'])for(const distance of [1,2,3,4,5]){
    const before=filled({Q5:1,Q6:distance}),after=cleanAnswers(schema,{...before,Q5:living});
    assert.equal(after.Q6,undefined);assert.equal(keys(after).includes('Q6'),false);
    assert.deepEqual(validateAll(schema,after),[]);
    const r=makeRecord(schema,after,metadata);assert.equal(r.asked.Q6,false);assert.equal(r.flat.V_Q6,'');assert.equal(r.flat.V_Q6__asked,0);
  }
});

test('Q5 returning on campus requires a new Q6 answer and does not resurrect the cleared value',()=>{
  const off=cleanAnswers(schema,{...filled({Q5:1,Q6:5}),Q5:2});
  const back=cleanAnswers(schema,{...off,Q5:1});assert.equal(back.Q6,undefined);assert.ok(keys(back).includes('Q6'));
  assert.ok(validateAll(schema,back).some(e=>e.key==='Q6'));assert.throws(()=>makeRecord(schema,back,metadata));
  const r=makeRecord(schema,{...back,Q6:3},metadata);assert.equal(r.flat.V_Q6,3);assert.equal(r.flat.V_Q6__asked,1);
});

test('Q6 99 is rejected when asked; stale off-campus values are removed rather than exported as missing answers',()=>{
  for(const value of [99,'99']){
    const on=filled({Q5:1,Q6:value});assert.ok(validateAll(schema,on).some(e=>e.key==='Q6'));assert.throws(()=>makeRecord(schema,on,metadata));
    const off=filled({Q5:2,Q6:value}),r=makeRecord(schema,off,metadata);assert.equal(r.answers.Q6,undefined);assert.equal(r.flat.V_Q6,'');assert.equal(r.flat.V_Q6__asked,0);
  }
});

test('all 75 living-and-interest combinations require Q31; Q6 still depends only on living location',()=>{
  for(const living of [1,2,3])for(const S of [1,2,3,4,5])for(const B of [1,2,3,4,5]){
    const a=filled({Q5:living,Q18_S:S,Q18_B:B,Q31:0});assert.deepEqual(validateAll(schema,a),[]);
    const r=makeRecord(schema,a,metadata);assert.equal(r.asked.Q6,living===1);assert.equal(r.asked.Q31,true);assert.equal(r.flat.V_Q31,0);assert.equal(r.flat.V_Q31__asked,1);
    const missing={...a};delete missing.Q31;assert.ok(validateAll(schema,missing).some(e=>e.key==='Q31'));assert.throws(()=>makeRecord(schema,missing,metadata));
    assert.equal(r.asked.Q32,true);assert.equal(r.asked.Q24,S>1||B>1);
  }
});

test('Q31 survives interest changes and remains absent for an ineligible respondent',()=>{
  const next=cleanAnswers(schema,{...filled({Q31:8}),Q18_S:1,Q18_B:1});assert.equal(next.Q31,8);assert.ok(keys(next).includes('Q31'));
  assert.equal(cleanAnswers(schema,{...next,Q1:0}).Q31,undefined);assert.equal(keys({Q1:0,Q31:8}).includes('Q31'),false);
});

test('Q24 uses only codes 1–5 and rejects the former standalone zero code',()=>{
  const q=question('Q24');assert.equal(q.type,'single');assert.deepEqual(q.options.map(o=>o.value),[1,2,3,4,5]);
  assert.equal(q.options[0].label,'Less than 15 minutes (or only occasionally)');
  assert.equal(q.help,'Count riding time only. If you would ride less than once a week, think about your average week.');
  for(const value of [1,2,3,4,5,'1','2','3','4','5'])assert.deepEqual(validateItem(q,'Q24',{Q24:value}),[]);
  for(const value of [0,'0',99,'99',-1,6,1.5,undefined,'',null,[1],true])assert.ok(validateItem(q,'Q24',{Q24:value}).length,JSON.stringify(value));
  assert.throws(()=>makeRecord(schema,filled({Q24:0}),metadata));
});

test('Q24 range boundaries remain exhaustive and mutually exclusive including zero in category 1',()=>{
  const q=question('Q24');
  const code=x=>q.options.filter(({interval:i})=>(i.lowerInclusive?x>=i.lower:x>i.lower)&&(i.upper===null||(i.upperInclusive?x<=i.upper:x<i.upper))).map(o=>o.value);
  for(const [amount,expected] of [[0,1],[.001,1],[14.999,1],[15,2],[29.999,2],[30,3],[59.999,3],[60,4],[119.999,4],[120,5],[1000000,5]])assert.deepEqual(code(amount),[expected],String(amount));
  assert.deepEqual(code(-.001),[]);assert.match(q.measurement.coding,/does not identify a separate zero-use response/);
  assert.match(q.measurement.coding,/Do not calculate means/);assert.doesNotMatch(q.measurement.coding,/0 is a substantive zero|break-even|identical/);
});

test('Q32 is exactly the required 0–10 recommendation scale, including a valid observed zero',()=>{
  const q=question('Q32');assert.equal(q.text,'How likely are you to recommend eZ2 Wheels to friends or family?');
  assert.equal(q.type,'scale');assert.equal(q.condition,'eligible');assert.equal(q.required,true);assert.equal(q.min,0);assert.equal(q.max,10);assert.equal(q.decimals,0);
  assert.deepEqual(q.options.map(o=>o.value),Array.from({length:11},(_,i)=>i));
  assert.equal(q.options[0].label,'0 = Not at all likely');assert.equal(q.options[10].label,'10 = Extremely likely');
  for(let value=0;value<=10;value++)for(const input of [value,String(value)]){
    const r=makeRecord(schema,filled({Q32:input}),metadata);assert.equal(r.answers.Q32,input);assert.equal(r.flat.V_Q32,value);assert.equal(r.flat.V_Q32__asked,1);
  }
  for(const input of [undefined,null,'',-1,11,.5,NaN,Infinity,true,false,[0],{},'Maybe','No'])assert.ok(validateItem(q,'Q32',{Q32:input}).length,JSON.stringify(input));
});

test('3.3 acceptance A: interested student can answer Q24=1 and Q32=10',()=>{
  const a=filled({Q18_S:5,Q18_B:5,Q24:1,Q32:10});assert.deepEqual(validateAll(schema,a),[]);
  const r=makeRecord(schema,a,metadata);assert.equal(r.flat.V_Q24_band,1);assert.equal(r.flat.V_Q24_band__asked,1);assert.equal(r.flat.V_Q32,10);assert.equal(r.flat.V_Q32__asked,1);
});

test('3.3 acceptance B: two uninterested products hide Q24 but still require and accept Q32=0',()=>{
  const a=filled({Q18_S:1,Q18_B:1,Q24:1,Q32:0});assert.equal(a.Q24,undefined);assert.deepEqual(validateAll(schema,a),[]);
  const r=makeRecord(schema,a,metadata);assert.equal(r.asked.Q24,false);assert.equal(r.flat.V_Q24_band,'');assert.equal(r.flat.V_Q24_band__asked,0);
  assert.equal(r.asked.Q31,true);assert.equal(r.asked.Q32,true);assert.equal(r.flat.V_Q32,0);assert.equal(r.flat.V_Q32__asked,1);
  const missing={...a};delete missing.Q32;assert.ok(validateAll(schema,missing).some(e=>e.key==='Q32'));assert.throws(()=>makeRecord(schema,missing,metadata));
});

test('Q32 remains required across all living and interest combinations and is cleared only by ineligibility',()=>{
  for(const living of [1,2,3])for(const S of [1,2,3,4,5])for(const B of [1,2,3,4,5]){
    const a=filled({Q5:living,Q18_S:S,Q18_B:B,Q32:0}),missing={...a};delete missing.Q32;
    assert.ok(validateAll(schema,missing).some(e=>e.key==='Q32'));assert.equal(makeRecord(schema,a,metadata).flat.V_Q32,0);
  }
  const next=cleanAnswers(schema,{...filled({Q32:10}),Q18_S:1,Q18_B:1});assert.equal(next.Q32,10);
  const no=makeRecord(schema,{Q1:0,Q32:10},metadata);assert.equal(no.answers.Q32,undefined);assert.equal(no.flat.V_Q32,'');assert.equal(no.flat.V_Q32__asked,0);
});
