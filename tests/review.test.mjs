import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {productIntroHtml} from '../product-intro.mjs';
import {
  allQuestions, expandedQuestions, conditionMet, cleanAnswers, validateItem,
  validateAll, makeRecord, recordsToCsv, verifyImportedRecord, otherKey
} from '../logic.mjs';

const schema = JSON.parse(await readFile(new URL('../survey.json', import.meta.url), 'utf8'));
const source = JSON.parse(await readFile(new URL('./fixtures/uploaded-v2.2.json', import.meta.url), 'utf8'));
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

test('uploaded 2.2 source changes are restricted to the approved fields, product introduction and section 7 title', () => {
  assert.equal(schema.version,'2.3'); assert.equal(source.version,'2.2');
  const actual=structuredClone(schema), expected=structuredClone(source);
  assert.equal(actual.sections.length,expected.sections.length);
  actual.version=expected.version;
  actual.productIntro=expected.productIntro;
  const allowed={
    Q2:['maxLength'],
    Q23:['text','help','type','variable','exportFields','options','missingValues','measurement','min','max','decimals'],
    Q24:['text','help','type','variable','exportFields','options','missingValues','measurement','min','max','decimals'],
    Q25:['text','help','type','variable','exportFields','options','missingValues','measurement','min','max','decimals'],
    Q26:['text','help','type','variable','exportFields','options','missingValues','measurement','min','max','decimals','condition']
  };
  const changed=[];
  for(const q of allQuestions(actual)) {
    const original=allQuestions(expected).find(item=>item.id===q.id);
    assert.ok(original,q.id);
    if(JSON.stringify(q)!==JSON.stringify(original)) changed.push(q.id);
    for(const key of allowed[q.id]||[]) {
      if(Object.hasOwn(original,key)) q[key]=structuredClone(original[key]);
      else delete q[key];
    }
    assert.deepEqual(q,original,`${q.id}: an unapproved question property changed`);
  }
  assert.deepEqual(changed,['Q2','Q23','Q24','Q25','Q26']);
  const section=actual.sections.find(s=>s.id==='expected_use');
  assert.equal(section.title,'Section 7 – Expected Use and Campus Travel Budget');
  section.title=expected.sections.find(s=>s.id==='expected_use').title;
  assert.deepEqual(actual,expected,'All other question text, choices, requiredness, Other rules, product routing, introduction and pricing must remain exact');
  assert.equal(qById('Q2').maxLength,120);
});

test('all 33 questions, codes, conditions and 98 field mappings are unique and internally complete', () => {
  assert.equal(questions.length,33);
  for(const key of ['id','number','variable']) assert.equal(new Set(questions.map(q=>q[key])).size,33,key);
  const fields=questions.flatMap(q=>q.exportFields);
  assert.equal(fields.length,98); assert.equal(new Set(fields).size,98);
  const conditions=new Set(['always','eligible','experienced','any_interest','charger_interest',
    ...['S','B'].flatMap(p=>['interested','uninterested','chose_plan','chose_none'].map(c=>`${c}_${p}`))]);
  for(const q of questions) {
    assert.equal(q.id,`Q${q.number}`); assert.equal(q.variable,`V_${q.id}${['Q23','Q24','Q25','Q26'].includes(q.id)?'_band':''}`);
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

test('Q6 preserves uploaded distance bands and explicit NA for all eligible respondents', () => {
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

const bandSpecs = {
  Q23:{unit:'USD_per_vehicle_charged',cuts:[0,2,5,10,15],fields:['V_Q23_band']},
  Q24:{unit:'hours_per_week',cuts:[0,.5,1,2,3,5],fields:['V_Q24_band_S','V_Q24_band_B']},
  Q25:{unit:'minutes_per_pickup',cuts:[0,5,10,15,20],fields:['V_Q25_band_S','V_Q25_band_B']},
  Q26:{unit:'USD_per_month',cuts:[0,10,20,40,60,100],fields:['V_Q26_band']}
};
function containingCodes(q,amount) {
  return q.options.filter(o=>{
    const i=o.interval;
    if(!i)return false;
    return (i.lowerInclusive?amount>=i.lower:amount>i.lower)&&
      (i.upper===null||(i.upperInclusive?amount<=i.upper:amount<i.upper));
  }).map(o=>o.value);
}

for(const [id,spec] of Object.entries(bandSpecs)) test(`${id}: bands are a complete non-overlapping partition with explicit zero and correct units`,()=>{
  const q=qById(id), opts=q.options.filter(o=>o.value!==99);
  assert.equal(q.measurement.kind,'ordered_category');
  assert.equal(q.measurement.unit,spec.unit);
  assert.match(q.measurement.coding,/category codes, not measured quantities/);
  assert.match(q.measurement.coding,/Do not calculate means/);
  assert.deepEqual(q.exportFields,spec.fields);
  assert.deepEqual(q.missingValues,[99]);
  assert.deepEqual(q.options.map(o=>o.value),[...Array.from({length:spec.cuts.length+1},(_,i)=>i),99]);
  assert.equal(q.options.at(-1).label,'Not sure yet');
  assert.equal(q.options.at(-1).interval,undefined);
  assert.deepEqual(opts[0].interval,{lower:0,upper:0,lowerInclusive:true,upperInclusive:true});
  for(let n=1;n<opts.length;n++){
    assert.deepEqual(opts[n].interval,{
      lower:spec.cuts[n-1],upper:spec.cuts[n]??null,
      lowerInclusive:n!==1,upperInclusive:false
    },`${id} category ${n}`);
  }
  assert.deepEqual(containingCodes(q,-.0001),[]);
  assert.deepEqual(containingCodes(q,0),[0]);
  assert.deepEqual(containingCodes(q,Number.MIN_VALUE),[1],'any positive amount belongs above zero');
  for(let i=1;i<spec.cuts.length;i++){
    const edge=spec.cuts[i],epsilon=Math.min(.0001,edge/100);
    assert.deepEqual(containingCodes(q,edge-epsilon),[i],`${id} immediately below ${edge}`);
    assert.deepEqual(containingCodes(q,edge),[i+1],`${id} exact boundary ${edge}`);
    assert.deepEqual(containingCodes(q,edge+epsilon),[i+1],`${id} immediately above ${edge}`);
  }
  for(const x of [0,.001,.25,.5,.75,1,1.5,2,4,5,9.99,10,15,20,40,60,100,168,1000000])
    assert.equal(containingCodes(q,x).length,1,`${id}: ${x} must belong to exactly one category`);
  for(const key of ['min','max','decimals'])assert.equal(q[key],undefined,'no obsolete continuous-number validation');
});

test('six new band export names replace old continuous fields without altering the 98-variable width',()=>{
  const oldFields=allQuestions(source).flatMap(q=>q.exportFields);
  const newFields=questions.flatMap(q=>q.exportFields);
  assert.deepEqual(oldFields.filter(f=>!newFields.includes(f)),['V_Q23','V_Q24_S','V_Q24_B','V_Q25_S','V_Q25_B','V_Q26']);
  assert.deepEqual(newFields.filter(f=>!oldFields.includes(f)),Object.values(bandSpecs).flatMap(s=>s.fields));
  assert.equal(7+newFields.length*2,203);
  const record=makeRecord(schema,filled(),metadata);
  for(const old of ['V_Q23','V_Q24_S','V_Q24_B','V_Q25_S','V_Q25_B','V_Q26'])assert.equal(Object.hasOwn(record.flat,old),false,old);
});

test('category zero remains substantive; 99 remains raw but exports missing, including string codes',()=>{
  for(const [id,spec] of Object.entries(bandSpecs)) {
    const q=qById(id);
    for(const product of q.products||[null]){
      const key=id+(product?'_'+product:''),field=spec.fields[(q.products||[null]).indexOf(product)];
      for(const code of [0,'0',99,'99']){
        const record=makeRecord(schema,filled({[key]:code}),metadata);
        assert.equal(record.answers[key],code);
        assert.equal(record.asked[key],true);
        assert.equal(record.flat[field],String(code)==='99'?'':0,field);
        assert.equal(record.flat[field+'__asked'],1,field);
        const restored=verifyImportedRecord(schema,{...record,flat:{[field]:777,[field+'__asked']:0}});
        assert.equal(restored.flat[field],String(code)==='99'?'':0);
        assert.equal(restored.flat[field+'__asked'],1);
      }
    }
  }
  const screened=makeRecord(schema,{Q1:0},metadata);
  for(const field of Object.values(bandSpecs).flatMap(s=>s.fields)){
    assert.equal(screened.flat[field],'');assert.equal(screened.flat[field+'__asked'],0);
  }
});

test('Q26 is required for all eligible students, including two uninterested products and no charger interest',()=>{
  assert.equal(qById('Q26').condition,'eligible');
  const answers=filled({Q16_S:1,Q16_B:1,Q22:1,Q26:0});
  const record=makeRecord(schema,answers,metadata);
  assert.equal(record.asked.Q26,true);
  assert.equal(record.flat.V_Q26_band,0);
  for(const key of ['Q23','Q24_S','Q24_B','Q25_S','Q25_B','Q27_S','Q27_B','Q30','Q31','Q32'])assert.equal(record.asked[key],false,key);
  const missing={...answers};delete missing.Q26;
  assert.ok(validateAll(schema,missing).some(e=>e.key==='Q26'));
  assert.throws(()=>makeRecord(schema,missing,metadata));
  const previouslyInterested=filled({Q26:3,Q24_S:5});
  const noInterest=cleanAnswers(schema,{...previouslyInterested,Q16_S:1,Q16_B:1});
  assert.equal(noInterest.Q26,3,'an upstream interest change must retain campus-wide budget');
  assert.equal(noInterest.Q24_S,undefined);
});

test('zero usage, pickup walk or budget does not force pricing skips; Not sure does not change interest routing',()=>{
  for(const S of [1,2,5])for(const B of [1,2,5])for(const code of [0,99,'99']){
    const overrides={Q16_S:S,Q16_B:B,Q23:code,Q24_S:code,Q24_B:code,Q25_S:code,Q25_B:code,Q26:code,Q27_S:1,Q27_B:4};
    const record=makeRecord(schema,filled(overrides),metadata);
    assert.equal(record.asked.Q24_S,S>1);
    assert.equal(record.asked.Q24_B,B>1);
    assert.equal(record.asked.Q27_S,S>1,'usage does not decide pricing eligibility');
    assert.equal(record.asked.Q27_B,B>1);
    assert.equal(record.asked.Q28_S,S>1);
    assert.equal(record.asked.Q29_B,B>1);
    assert.equal(record.asked.Q17_S,S===1);
    assert.equal(record.asked.Q17_B,B===1);
    assert.equal(record.asked.Q26,true);
    assert.equal(record.asked.Q30,S>1||B>1);
  }
});

test('product descriptions use the same comparison headings and identify pending review facts',()=>{
  assert.equal(schema.productIntro.length,2);
  const headings=schema.productIntro.map(block=>block.split('\n').slice(1).map(line=>line.split(':')[0]));
  assert.deepEqual(headings[0],['Pick-up','Return','Riding area','Range','Rental duration','Charging']);
  assert.deepEqual(headings[1],headings[0]);
  for(const block of schema.productIntro)assert.match(block,/to be confirmed/i);
});

test('product comparison renders the shared features and escapes title, label and body text with legacy fallback',()=>{
  const html=productIntroHtml(schema.productIntro);
  assert.equal((html.match(/role="rowheader"/g)||[]).length,6);
  assert.equal((html.match(/role="columnheader"/g)||[]).length,3);
  assert.equal((html.match(/role="cell"/g)||[]).length,12);
  for(const feature of ['Pick-up','Return','Riding area','Range','Rental duration','Charging'])assert.ok(html.includes('>'+feature+'</th>'),feature);
  assert.match(html,/nearest available scooter anywhere on campus/);
  assert.match(html,/closest to your destination/);
  const hostile=productIntroHtml([
    '<img src=x onerror="bad">\n<script>: A & B <svg onload="bad">',
    'Bike\n<script>: <b>unsafe</b>'
  ]);
  for(const fragment of ['<img','<script>','<svg','<b>unsafe'])assert.equal(hostile.includes(fragment),false,fragment);
  for(const fragment of ['&lt;img','&lt;script&gt;','A &amp; B','&lt;svg','&quot;bad&quot;'])assert.ok(hostile.includes(fragment),fragment);
  const legacy=productIntroHtml(source.productIntro);
  assert.match(legacy,/eZ2 S/);assert.match(legacy,/eZ2 B/);
  assert.match(legacy,/nearest available scooter anywhere on campus/);
  assert.doesNotThrow(()=>productIntroHtml(['A single-line description <safe>']));
  assert.ok(productIntroHtml(['A single-line description <safe>']).includes('&lt;safe&gt;'));
});

const gsSource=await readFile(new URL('../google-sheets/UnifiedCollector.gs',import.meta.url),'utf8');
const frontendLogic=await readFile(new URL('../logic.mjs',import.meta.url),'utf8');
const unionHeaders=JSON.parse(await readFile(new URL('../google-sheets/headers.json',import.meta.url),'utf8'));
const server=vm.createContext({});
vm.runInContext(gsSource,server);
const plain=value=>JSON.parse(JSON.stringify(value));

test('released frontend matches the unified collector 2.3 engine and the 215-column Responses contract',()=>{
  assert.deepEqual(plain(server.engineForVersion_('2.3').schema),schema);
  const normalize=s=>s.replace(/\r\n/g,'\n').replace(/^export /gm,'')
    .replaceAll('Object.hasOwn(', 'Object.prototype.hasOwnProperty.call(')
    .split('\n').filter(line=>!line.trim().startsWith('// Review draft')).join('\n').trim();
  const engine23Source=gsSource.split('"2.3":(function(){')[1].split('return Object.freeze({schema:SURVEY_SCHEMA')[0];
  assert.ok(normalize(engine23Source).endsWith(normalize(frontendLogic)),'the entire shared 2.3 logic must remain identical');
  assert.equal(vm.runInContext('BACKEND_SETTINGS.sheetName',server),'Responses');
  const headers=plain(server.backendHeaders_());
  assert.equal(headers.length,215);assert.equal(new Set(headers).size,215);
  assert.deepEqual(headers,unionHeaders);
  assert.deepEqual(headers.slice(7,203),questions.flatMap(q=>q.exportFields).flatMap(f=>[f,f+'__asked']));
  assert.deepEqual(headers.slice(203),['V_Q23','V_Q24_S','V_Q24_B','V_Q25_S','V_Q25_B','V_Q26'].flatMap(f=>[f,f+'__asked']));
});

test('frontend and backend recompute the same raw, normalized and asked data over branch/uncertainty combinations',()=>{
  for(const S of [1,5])for(const B of [1,5])for(const code of [0,99,'99'])for(const experience of [1,2]){
    const answers=filled({Q16_S:S,Q16_B:B,Q12:experience,Q23:code,Q24_S:code,Q24_B:code,Q25_S:code,Q25_B:code,Q26:code,Q27_S:4,Q27_B:1});
    const browser=makeRecord(schema,answers,metadata);
    const backend=plain(server.canonicalRecord_({...browser,flat:{V_Q26_band:88},asked:{Q26:false}}));
    assert.deepEqual(backend.answers,browser.answers);
    assert.deepEqual(backend.asked,browser.asked);
    assert.deepEqual(backend.flat,browser.flat);
    assert.deepEqual(backend.planOrder,metadata.planOrder.map(String));
  }
});

test('old versions cannot import into the 2.3 browser; collector rejects 2.0/2.1 while retaining its separate 2.2 engine',()=>{
  const current=makeRecord(schema,filled(),metadata);
  for(const old of ['2.0','2.1','2.2']){
    const previous={...current,schemaVersion:old};
    assert.throws(()=>verifyImportedRecord(schema,previous),/version/i);
    assert.throws(()=>recordsToCsv([current,previous]),/different survey versions/i);
    assert.throws(()=>recordsToCsv([previous,current]),/different survey versions/i);
    if(old!=='2.2')assert.throws(()=>server.canonicalRecord_(previous),/version/i);
  }
  assert.equal(server.engineForVersion_('2.2').schema.version,'2.2');
  assert.equal(recordsToCsv([]),'');
  assert.doesNotThrow(()=>recordsToCsv([current,{...current,responseId:'33333333-3333-4333-8333-333333333333'}]));
});
