import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {schema,question,metadata,filled} from './helpers.mjs';
import {expandedQuestions,cleanAnswers,validateAll,makeRecord,visibleProducts,updateMultiSelection} from '../logic.mjs';
import {questionsForSection,pricingOptionsHtml,SCREEN_OUT_TEXT} from '../presentation.mjs';
import {productIntroHtml} from '../product-intro.mjs';
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
test('screenshot requirement 4: two uninterested products skip Q24–Q28 and Q31–Q32 while charger and comments remain',()=>{
  const a=filled({Q18_S:1,Q18_B:1});
  for(const item of expandedQuestions(schema,a))assert.equal([24,25,26,27,28,31,32].includes(item.q.number),false,item.key);
  for(const id of ['Q19_S','Q19_B','Q20','Q21_S','Q21_B','Q22_S','Q22_B','Q23_S','Q23_B','Q29','Q30','Q33'])assert.ok(keys(a).includes(id),id);
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
test('all entry points load 3.1 resources and app uses tested presentation and cleanup functions',async()=>{
  for(const name of ['app.mjs','admin.mjs','index.html','admin.html','presentation.mjs']){
    const source=await readFile(new URL('../'+name,import.meta.url),'utf8');assert.doesNotMatch(source,/\?v=2\./,name);assert.match(source,/\?v=3\.1/,name);
    if(name==='app.mjs'){
      assert.match(source,/questionsForSection\(section,state.answers\)/);assert.match(source,/pricingOptionsHtml\(schema,q,product,key,value,state.planOrder\)/);
      assert.match(source,/inputHtml\(q,keyFor\(q,p\),p\)/);assert.match(source,/state.answers=cleanAnswers\(schema,state.answers\)/);
      assert.match(source,/o.other&&chosen/);assert.match(source,/SCREEN_OUT_TEXT/);assert.doesNotMatch(source,/schema.plans.find/);
    }
  }
});
