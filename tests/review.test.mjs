import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {schema,questions,question,metadata,filled} from './helpers.mjs';
import {allQuestions,expandedQuestions,validateItem,validateAll,makeRecord,verifyImportedRecord,otherKey} from '../logic.mjs';
const uploadBytes=await readFile(new URL('./fixtures/uploaded-v3.3.json',import.meta.url));
const upload=JSON.parse(uploadBytes.toString('utf8'));

test('the immutable latest upload is preserved except release version, approved Q32 wording and two retained analytical metadata corrections',()=>{
  const actual=structuredClone(schema),expected=structuredClone(upload);
  assert.equal(actual.version,'3.3');
  assert.equal(createHash('sha256').update(uploadBytes).digest('hex'),'8034b120e027b5c2062776bc288f55e4e4c4a1ac914324ea8a4a235e039eb3de');
  actual.version=expected.version;
  const a=allQuestions(actual),e=allQuestions(expected);
  const q32=a.find(q=>q.id==='Q32'),original32=e.find(q=>q.id==='Q32');
  assert.equal(q32.text,'How likely are you to recommend eZ2 Wheels to friends or family?');
  assert.equal(original32.text,'How likely are you to recommend eZ2 Wheels to a friend or classmate?');
  // Only the approved Q32 sentence is normalized; its scale, audience and all other fields remain compared.
  q32.text=original32.text;
  const q24=a.find(q=>q.id==='Q24'),original24=e.find(q=>q.id==='Q24');
  assert.notEqual(q24.measurement.coding,original24.measurement.coding);
  assert.match(q24.measurement.coding,/Combined weekly riding time/);
  assert.doesNotMatch(q24.measurement.coding,/identical|break-even|pay-per-use;|hybrid;/);
  q24.measurement.coding=original24.measurement.coding;
  const q30=a.find(q=>q.id==='Q30');assert.equal(q30.options[0].interval.lowerInclusive,true);
  q30.options[0].interval.lowerInclusive=e.find(q=>q.id==='Q30').options[0].interval.lowerInclusive;
  assert.deepEqual(actual,expected,'No displayed question, option, price, description, condition or other metadata may drift');
});

test('the latest upload changes only Q24 usage categories and Q32 recommendation meaning and audience',async()=>{
  const previous=JSON.parse(await readFile(new URL('./fixtures/uploaded-v3.2.json',import.meta.url),'utf8'));
  const actual=structuredClone(upload),before=allQuestions(previous),after=allQuestions(actual);
  const allowed={Q24:['oldRef','options','help','measurement'],Q32:['oldRef','text','type','condition','options','min','max','decimals']};
  for(const q of after){
    const old=before.find(item=>item.id===q.id);
    for(const key of allowed[q.id]||[]){if(Object.hasOwn(old,key))q[key]=structuredClone(old[key]);else delete q[key];}
  }
  assert.deepEqual(actual,previous,'All other question wording, prices, field names and conditions must stay unchanged');
});

test('all 33 question numbers, variables, options, condition names and 98 exports are internally complete',()=>{
  assert.deepEqual(questions.map(q=>q.id),Array.from({length:33},(_,i)=>'Q'+(i+1)));
  for(const name of ['id','number','variable'])assert.equal(new Set(questions.map(q=>q[name])).size,33,name);
  const fields=questions.flatMap(q=>q.exportFields);assert.equal(fields.length,98);assert.equal(new Set(fields).size,98);
  const conditions=new Set(Object.keys(schema.conditionDefinitions));
  for(const q of questions){
    assert.equal(q.id,'Q'+q.number);assert.equal(q.variable,'V_'+q.id+(['Q12','Q24','Q25','Q30'].includes(q.id)?'_band':''));
    assert.equal(new Set(q.options.map(o=>String(o.value))).size,q.options.length,q.id);
    for(const c of [q.condition,...Object.values(q.productConditions||{})])for(const part of c.split('||'))assert.ok(conditions.has(part.trim()),q.id+': '+part);
    const expected=[];
    for(const p of q.products||[null]){
      const suffix=p?'_'+p:'';
      expected.push(...(q.type.endsWith('multi')?q.options.map(o=>q.variable+'_'+o.value+suffix):[q.variable+suffix]));
      for(const o of q.options.filter(o=>o.other))expected.push(p?o.otherFields[p]:o.otherField);
    }
    assert.deepEqual(q.exportFields,expected,q.id);
    if(q.type.endsWith('scale'))assert.deepEqual(q.options.map(o=>o.value),Array.from({length:q.max-q.min+1},(_,i)=>q.min+i));
  }
});

for(const q of questions)test(`${q.id}: every valid choice, requiredness, malformed values, boundaries and Other detail`,()=>{
  const type=q.type.replace('product_','');
  for(const p of q.products||[null]){
    const key=q.id+(p?'_'+p:'');
    const check=(value,details={})=>validateItem(q,key,{[key]:value,...details});
    for(const value of [undefined,null,''])assert.equal(check(value).length>0,q.required,key+' empty');
    let valid=[];
    if(type==='single'||type==='scale')valid=q.options.map(o=>o.value);
    if(type==='multi')valid=[...q.options.map(o=>[o.value]),q.options.map(o=>o.value)];
    if(type==='number')valid=[q.min??0,q.max??20];
    if(type==='text')valid=['An answer','x'.repeat(q.maxLength)];
    for(const value of valid){
      const details=Object.fromEntries(q.options.filter(o=>o.other).map(o=>[otherKey(key,o),'A specific explanation']));
      assert.deepEqual(check(value,details),[],key+' valid '+JSON.stringify(value));
      if(['single','scale','number'].includes(type))assert.deepEqual(check(String(value),details),[],key+' string code');
    }
    const invalid=[{},true,false];
    if(type==='single')invalid.push([], [q.options[0].value], '__invalid__',-999,1.5);
    if(type==='multi')invalid.push([],q.options[0].value,'__invalid__',[-999],[q.options[0].value,q.options[0].value],[q.options[0].value,String(q.options[0].value)],[{}]);
    if(type==='number'||type==='scale')invalid.push([], [0], NaN, Infinity, 'not a number','1e2','0x1',(q.min??0)-1,(q.max??20)+1,(q.min??0)+.5);
    if(type==='text')invalid.push(1,[],['text'],'x'.repeat(q.maxLength+1));
    for(const value of invalid)assert.ok(check(value).length,key+' rejects '+JSON.stringify(value));
    for(const option of q.options.filter(o=>o.other)){
      const value=type==='multi'?[option.value]:option.value,detail=otherKey(key,option);
      for(const text of [undefined,null,'','   ',{},1,'x'.repeat(option.otherMaxLength+1)])assert.ok(check(value,{[detail]:text}).some(e=>e.key===detail),detail);
      assert.deepEqual(check(value,{[detail]:'x'.repeat(option.otherMaxLength)}),[]);
      const normal=q.options.find(o=>!o.other).value;assert.deepEqual(check(type==='multi'?[normal]:normal,{[detail]:''}),[]);
    }
  }
});

test('all 33 questions are reached; every required visible answer prevents completion when omitted',()=>{
  const covered=new Set();
  for(const overrides of [{},{Q18_S:1,Q18_B:1},{Q26_S:4,Q26_B:4}]){
    const a=filled(overrides);assert.deepEqual(validateAll(schema,a),[]);
    for(const {q,key} of expandedQuestions(schema,a)){
      covered.add(q.id);const missing={...a};delete missing[key];
      assert.equal(validateAll(schema,missing).some(e=>e.key===key),q.required,key);
      if(q.required)assert.throws(()=>makeRecord(schema,missing,metadata));else assert.doesNotThrow(()=>makeRecord(schema,missing,metadata));
    }
  }
  assert.equal(covered.size,33);
});

function contains(q,x){return q.options.filter(o=>o.interval).filter(({interval:i})=>(i.lowerInclusive?x>=i.lower:x>i.lower)&&(i.upper===null||(i.upperInclusive?x<=i.upper:x<i.upper))).map(o=>o.value);}
for(const [id,unit] of [['Q12','USD_per_month'],['Q24','minutes_per_week'],['Q25','minutes_per_pickup'],['Q30','USD_per_vehicle_charged']])test(`${id}: category intervals partition nonnegative amounts without overlap or gaps`,()=>{
  const q=question(id);assert.equal(q.measurement.kind,'ordered_category');assert.equal(q.measurement.unit,unit);
  assert.match(q.measurement.coding,/category codes, not measured quantities/);assert.match(q.measurement.coding,/Do not calculate means/);
  assert.equal(q.missingValues,undefined);
  assert.deepEqual(contains(q,-.001),[]);
  const bounds=q.options.flatMap(o=>[o.interval.lower,o.interval.upper]).filter(x=>x!==null);
  for(const x of [0,Number.MIN_VALUE,...bounds.flatMap(v=>[v-.00001,v,v+.00001]),1000000].filter(v=>v>=0))assert.equal(contains(q,x).length,1,id+' amount '+x);
  assert.equal(contains(q,0)[0],id==='Q12'?0:1);
  for(const key of ['min','max','decimals'])assert.equal(q[key],undefined);
});

test('Q6 has exact latest source options and on-campus routing; deliberate omissions are not restored',()=>{
  assert.deepEqual(question('Q6'),allQuestions(upload).find(q=>q.id==='Q6'));
  assert.deepEqual(question('Q6').options.map(o=>o.value),[1,2,3,4,5]);assert.equal(question('Q6').condition,'on_campus');
  assert.equal(question('Q6').missingValues,undefined);
  assert.ok(validateItem(question('Q6'),'Q6',{Q6:99}).length);
  for(const living of [1,2,3])for(const distance of [1,5])assert.deepEqual(validateAll(schema,filled({Q5:living,Q6:distance})),[]);
  assert.equal(question('Q8').options.some(o=>o.value===9),false);assert.equal(question('Q8').exclusiveValues,undefined);
  assert.deepEqual(question('Q16').options.map(o=>o.value),[1,2,3,4,5]);assert.equal(question('Q16').missingValues,undefined);
  for(const id of ['Q12','Q24','Q25','Q30'])assert.equal(question(id).options.some(o=>o.value===99),false,id);
});

const gs=await readFile(new URL('../google-sheets/UnifiedCollector.gs',import.meta.url),'utf8');
const frontend=await readFile(new URL('../logic.mjs',import.meta.url),'utf8');
const headersFile=JSON.parse(await readFile(new URL('../google-sheets/headers.json',import.meta.url),'utf8'));
const server=vm.createContext({});vm.runInContext(gs,server);const plain=v=>JSON.parse(JSON.stringify(v));
test('3.3 frontend matches its collector engine and shares the existing 196-column v3_1 suffix',()=>{
  assert.deepEqual(plain(server.engineForVersion_('3.3').schema),schema);
  const normalize=s=>s.replace(/\r\n/g,'\n').replace(/^export /gm,'').replaceAll('Object.hasOwn(', 'Object.prototype.hasOwnProperty.call(').trim();
  const source=gs.split('"3.3":(function(){')[1].split('return Object.freeze({schema:SURVEY_SCHEMA')[0];
  assert.ok(normalize(source).endsWith(normalize(frontend)),'complete shared logic must be identical');
  const headers=plain(server.backendHeaders_());assert.equal(headers.length,413);assert.equal(new Set(headers).size,413);assert.deepEqual(headers,headersFile);
  assert.deepEqual(headers.slice(217),questions.flatMap(q=>q.exportFields).flatMap(f=>['v3_1__'+f,'v3_1__'+f+'__asked']));
  for(const version of ['2.2','2.3','2.4','3.1','3.2'])assert.equal(server.engineForVersion_(version).schema.version,version);
});

test('frontend and collector recompute identical raw, normalized and asked data over all eight key paths',()=>{
  for(const overrides of [{},{Q13:0},{Q18_S:1},{Q18_B:1},{Q18_S:1,Q18_B:1},{Q26_S:4,Q26_B:4},{Q29:1},{Q3:8,Q3__8_text:'Other study',Q8:[8],Q8__8_text:'Other mode',Q5:2,Q6:99}]){
    const browser=makeRecord(schema,filled(overrides),metadata),backend=plain(server.canonicalRecord_({...browser,flat:{V_Q1:0},asked:{Q1:false}}));
    assert.deepEqual(backend.answers,browser.answers);assert.deepEqual(backend.asked,browser.asked);assert.deepEqual(backend.flat,browser.flat);
  }
});

test('3.3 browser refuses all older imports so different routes cannot be silently reinterpreted',()=>{
  const current=makeRecord(schema,filled(),metadata);
  for(const old of ['2.0','2.1','2.2','2.3','2.4','3.1','3.2'])assert.throws(()=>verifyImportedRecord(schema,{...current,schemaVersion:old}),/version/);
});
