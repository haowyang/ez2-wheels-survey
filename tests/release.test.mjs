import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {allQuestions,expandedQuestions,cleanAnswers,validateItem,makeRecord,updateMultiSelection,conditionMet} from '../logic.mjs';
const schema=JSON.parse(await readFile(new URL('../survey.json',import.meta.url),'utf8'));
const original=JSON.parse(await readFile(new URL('./fixtures/uploaded-v2.2.json',import.meta.url),'utf8'));
const question=id=>allQuestions(schema).find(q=>q.id===id);
const metadata={responseId:'44444444-4444-4444-8444-444444444444',startedAt:'2026-10-22T16:00:00.000Z',completedAt:'2026-10-22T16:05:00.000Z',planOrder:[1,3,2]};
function complete(overrides={}){
  const a={Q1:1,Q12:2,Q16_S:2,Q16_B:2,Q22:1,Q27_S:1,Q27_B:1,...overrides};
  for(let pass=0;pass<4;pass++)for(const {q,key} of expandedQuestions(schema,a)){
    if(Object.hasOwn(a,key))continue;
    const type=q.type.replace('product_','');
    a[key]=type==='multi'?[q.options[0].value]:type==='text'?(q.required?'Test university':''):type==='single'?q.options[0].value:q.min??0;
  }
  return cleanAnswers(schema,a);
}
test('Q5 separates on-campus, off-campus within walking distance, and beyond walking distance',()=>{
  assert.deepEqual(question('Q5').options,[{value:1,label:'On campus'},{value:2,label:'Off campus, within walking distance of campus'},{value:3,label:'Off campus, beyond walking distance of campus'}]);
});
test('all 511 Q8 selection sets enforce no-travel exclusivity without restricting ordinary combinations',()=>{
  const q=question('Q8');assert.deepEqual(q.exclusiveValues,[9]);
  assert.deepEqual(q.options.map(o=>o.value),[1,2,3,4,5,6,7,8,9]);
  for(let mask=1;mask<512;mask++){
    const values=q.options.filter((o,i)=>mask&(1<<i)).map(o=>o.value),expectedInvalid=values.includes(9)&&values.length>1;
    for(const selected of [values,values.map(String)])assert.equal(validateItem(q,'Q8',{Q8:selected,Q8__8_text:'Other travel mode'}).length>0,expectedInvalid,JSON.stringify(selected));
  }
  assert.ok(validateItem(q,'Q8',{Q8:[9,'9']}).length,'duplicate number/string code is invalid');
});
test('UI multi-select transitions clear other modes for no-travel and clear no-travel for another mode',()=>{
  const q=question('Q8');assert.deepEqual(updateMultiSelection(q,[1,4,8],9,true),[9]);
  for(const option of q.options.filter(o=>o.value!==9))for(const current of [[9],['9']])assert.deepEqual(updateMultiSelection(q,current,option.value,true),[option.value]);
  assert.deepEqual(updateMultiSelection(q,[1,4],8,true),[1,4,8]);
  assert.deepEqual(updateMultiSelection(q,[9],9,false),[]);
  assert.deepEqual(updateMultiSelection(q,[1,4],1,false),[4]);
  assert.deepEqual(updateMultiSelection(q,[1],1,true),[1],'repeated event does not duplicate a choice');
  const a=complete({Q8:[8],Q8__8_text:'Other mode'});a.Q8=updateMultiSelection(q,a.Q8,9,true);
  assert.equal(cleanAnswers(schema,a).Q8__8_text,undefined,'hidden Other explanation is removed');
});
test('no-travel answer is an observed binary response and does not skip campus budget or attitudes',()=>{
  const r=makeRecord(schema,complete({Q8:[9],Q8__8_text:'must disappear',Q16_S:1,Q16_B:1}),metadata);
  assert.deepEqual(r.answers.Q8,[9]);assert.equal(r.answers.Q8__8_text,undefined);
  for(let i=1;i<=9;i++){assert.equal(r.flat['V_Q8_'+i],i===9?1:0);assert.equal(r.flat['V_Q8_'+i+'__asked'],1);}
  assert.equal(r.flat.V_Q8_Other_txt,'');assert.equal(r.flat.V_Q8_Other_txt__asked,0);
  for(const key of ['Q26','Q18','Q22'])assert.equal(r.asked[key],true);
  assert.equal(Object.keys(r.flat).length,198);
});
test('Q12 labels separate lifetime trials from fixed recent-use categories with no overlapping histories',()=>{
  const q=question('Q12');assert.deepEqual(q.options.map(o=>o.value),[1,2,3,4,5]);assert.equal(q.options[0].label,'Never');
  assert.match(q.options[1].label,/Only 1 or 2.*in my lifetime/);
  for(const option of q.options.slice(2)){assert.match(option.label,/More than 2.*in my lifetime/);assert.match(option.label,/past 3 months/);}
  assert.match(q.options[2].label,/less than 1 ride per month/);assert.match(q.options[3].label,/1 to less than 4 rides per month/);assert.match(q.options[4].label,/4 or more rides per month/);
  assert.match(q.help,/divided by 3/);assert.match(q.help,/Zero rides.*less than 1/);
  for(let lifetime=0;lifetime<=60;lifetime++)for(let recent=0;recent<=lifetime;recent++){
    const average=recent/3,groups=[lifetime===0,lifetime>=1&&lifetime<=2,lifetime>2&&average<1,lifetime>2&&average>=1&&average<4,lifetime>2&&average>=4];
    assert.equal(groups.filter(Boolean).length,1,`lifetime=${lifetime}, last3months=${recent}`);
  }
  for(const code of [2,3,4,5,'2','3','4','5'])assert.equal(conditionMet('experienced',{Q1:1,Q12:code}),true);
  for(const code of [1,0,99,undefined,[2],{}])assert.equal(conditionMet('experienced',{Q1:1,Q12:code}),false);
});
test('Q14 insufficient-experience code stays raw 99 but exports missing with asked=1',()=>{
  const q=question('Q14');assert.deepEqual(q.missingValues,[99]);assert.equal(q.options.find(o=>o.value===99).label,'Not enough experience to judge');
  for(const code of [99,'99']){const r=makeRecord(schema,complete({Q12:2,Q14:code}),metadata);assert.equal(r.answers.Q14,code);assert.equal(r.flat.V_Q14,'');assert.equal(r.flat.V_Q14__asked,1);assert.equal(r.asked.Q13,true);}
  for(const code of [1,2,3,4,5])assert.equal(makeRecord(schema,complete({Q14:code}),metadata).flat.V_Q14,code);
  const never=makeRecord(schema,complete({Q12:1,Q14:99}),metadata);assert.equal(never.answers.Q14,undefined);assert.equal(never.flat.V_Q14,'');assert.equal(never.flat.V_Q14__asked,0);
});
test('Q6 remains exactly protected and product comparison adds no unprovided specifications',()=>{
  assert.deepEqual(question('Q6'),allQuestions(original).find(q=>q.id==='Q6'));
  assert.deepEqual(schema.productIntro,[
    'eZ2 S — Electric scooters\nPick-up: Use the app to find and unlock the nearest available scooter anywhere on campus.\nReturn: The app shows where to leave it closest to your destination.\nCharging: Stations are located around campus.',
    'eZ2 B — Electric bikes\nPick-up: Take an e-bike from a designated bike stand on campus.\nReturn: Return it to any designated bike stand on campus.\nCharging: Stations are available.'
  ]);
  assert.doesNotMatch(schema.productIntro.join('\n'),/draft|confirm|range|riding area|rental duration|miles|unlimited|off campus/i);
});
test('published resources use 2.4 cache keys and wire the tested exclusive-selection helper',async()=>{
  for(const name of ['app.mjs','admin.mjs','index.html','admin.html']){
    const source=await readFile(new URL('../'+name,import.meta.url),'utf8');assert.doesNotMatch(source,/\?v=2\.[0-3]/,name);assert.match(source,/\?v=2\.4/,name);
    if(name==='app.mjs')assert.match(source,/state\.answers\[key\]=updateMultiSelection\(question,state\.answers\[key\],Number\(input\.value\),input\.checked\)/);
  }
});
