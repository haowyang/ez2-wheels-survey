/* Offline integration tests: real release source, in-memory Apps Script services, no network. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const site=path.resolve(__dirname,'..'),root=path.join(site,'google-sheets');
const source=fs.readFileSync(path.join(root,'UnifiedCollector.gs'),'utf8'),headers=JSON.parse(fs.readFileSync(path.join(root,'headers.json'),'utf8'));
const previousHeaders=JSON.parse(fs.readFileSync(path.join(root,'testing/fixtures/previous-unified-headers.json'),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x)),sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const oracles={},oracleSources={};
for(const version of ['2.2','2.3']){
 const c=vm.createContext({}),text=fs.readFileSync(path.join(root,'testing/fixtures/original-'+version+'.gs.txt'),'utf8');
 vm.runInContext(text,c);oracles[version]=c;oracleSources[version]=text;
}
const previous24=fs.readFileSync(path.join(root,'testing/fixtures/original-2.4.gs.txt'),'utf8');
const previous31=fs.readFileSync(path.join(root,'testing/fixtures/original-3.1.gs.txt'),'utf8');
const frozenRules={};
for(const [version,text] of [['2.4',previous24],['3.1',previous31]]){
 oracles[version]=vm.createContext({});vm.runInContext(text,oracles[version]);oracleSources[version]=text;
 frozenRules[version]=vm.createContext({});vm.runInContext(text.split('"'+version+'":(function(){')[1].split('return Object.freeze({schema:SURVEY_SCHEMA')[0],frozenRules[version]);
}
const currentSchema=JSON.parse(fs.readFileSync(path.join(site,'survey.json'),'utf8'));
const frontend=fs.readFileSync(path.join(site,'logic.mjs'),'utf8').replace(/^export /gm,'');
oracles['3.2']=vm.createContext({});vm.runInContext('const SURVEY_SCHEMA='+JSON.stringify(currentSchema)+';\n'+frontend,oracles['3.2']);
const schemaFor=v=>['2.4','3.1'].includes(v)?clone(oracles[v].engineForVersion_(v).schema):JSON.parse(vm.runInContext('JSON.stringify(SURVEY_SCHEMA)',oracles[v]));
const rulesFor=v=>frozenRules[v]||oracles[v];
const expectedRecord=p=>p.schemaVersion==='3.2'?oracles['3.2'].makeRecord(currentSchema,p.answers,{...p,planOrder:p.planOrder.map(String)}):oracles[p.schemaVersion].canonicalRecord_(p);
const priorWidth=217,totalWidth=headers.length,extraWidth=totalWidth-priorWidth,firstNew='v3_1__V_Q1';
let counter=100;
function packet(version,overrides={}){
 const p=JSON.parse(fs.readFileSync(path.join(root,'testing/qa/packet-'+version+'.json'),'utf8'));
 p.responseId='aaaaaaaa-aaaa-4aaa-8aaa-'+String(++counter).padStart(12,'0');Object.assign(p.answers,overrides);
 for(let pass=0;pass<4;pass++)for(const {q,key} of rulesFor(version).expandedQuestions(schemaFor(version),p.answers)){
  if(p.answers[key]!==undefined)continue;
  const type=q.type.replace('product_','');p.answers[key]=type==='text'?'SYNTHETIC':type==='multi'?[q.options[0].value]:type==='single'?q.options[0].value:q.min||0;
 }
 return p;
}
function digest(r){return sha(JSON.stringify({version:r.schemaVersion,answers:r.answers,planOrder:r.planOrder}));}
function rowFor(p,width=priorWidth){
 const r=expectedRecord(p),fields={submission_id:r.responseId,received_at_utc:'2026-10-23T17:00:00.000Z',survey_version:r.schemaVersion,started_at_utc:r.startedAt,completed_at_utc:r.completedAt,plan_order:r.planOrder.join('|'),payload_sha256:digest(r)};
 for(const [key,value] of Object.entries(r.flat))fields[['3.1','3.2'].includes(p.schemaVersion)?'v3_1__'+key:key]=value;
 return (width===priorWidth?previousHeaders:headers).map(f=>{
  const value=Object.hasOwn(fields,f)?fields[f]:f.endsWith('__asked')?0:'';
  return typeof value==='string'&&/^[=+\-@\t\r]/.test(value)?"'"+value:String(value??'');
 });
}
function harness({upgraded=true,rows=[],columns}={}){
 const state={locked:false,writes:[],expansions:[],flushes:0,failWrite:false,failHeaderWrite:false,partialHeaderFailure:false,failExpand:false,failFlushAt:0,corruptExtraRead:false,onExtraWrite:null,throwAfterExtraWrite:false,logs:[],reads:[],boundReads:false};
 const sheets={};
 class Range{
  constructor(sheet,row,col,n=1,width=1){Object.assign(this,{sheet,row,col,n,width});assert.ok(row>=1&&col>=1&&n>=1&&col+width-1<=sheet.maxColumns);}
  getRow(){return this.row;}
  getDisplayValues(){
   state.reads.push({row:this.row,column:this.col,count:this.n,width:this.width});if(state.boundReads)assert.ok(this.n<=100,'upgrade reads are bounded to 100 rows');
   const values=Array.from({length:this.n},(_,r)=>Array.from({length:this.width},(_,c)=>this.sheet.data[this.row+r-1]?.[this.col+c-1]??''));
   if(state.corruptExtraRead&&this.row>1&&this.col===218&&state.writes.some(w=>w.column===218&&w.row>1))values[0][0]='bad read';
   return values;
  }
  setRichTextValues(values){
   assert.equal(state.locked,true,'writes must hold the script lock');assert.equal(values.length,this.n);
   if(state.failWrite||(state.failHeaderWrite&&this.row===1))throw Error('mock write failure');
   const partial=state.partialHeaderFailure&&this.row===1;
   values.forEach((row,r)=>{assert.equal(row.length,this.width);this.sheet.data[this.row+r-1]||=[];row.forEach((v,c)=>{if(!partial||c===0)this.sheet.data[this.row+r-1][this.col+c-1]=v.text;});});
   state.writes.push({row:this.row,column:this.col,count:this.n,width:this.width});
   if(this.row>1&&this.col===218&&state.onExtraWrite){const callback=state.onExtraWrite;state.onExtraWrite=null;callback();}
   if(partial||(this.row>1&&this.col===218&&state.throwAfterExtraWrite))throw Error('mock applied-write failure');
  }
  createTextFinder(text){const range=this;return {matchEntireCell(v){assert.equal(v,true);return this;},findNext(){const i=range.getDisplayValues().findIndex(r=>r[0]===text);return i<0?null:new Range(range.sheet,range.row+i,range.col);}};}
 }
 class Sheet{
  constructor(data,maxColumns){this.data=clone(data);this.maxColumns=maxColumns;}
  getLastRow(){let n=this.data.length;while(n&&!this.data[n-1].some(v=>v!==''&&v!=null))n--;return n;}
  getLastColumn(){return Math.max(0,...this.data.map(row=>{let n=row.length;while(n&&(row[n-1]===''||row[n-1]==null))n--;return n;}));}
  getMaxColumns(){return this.maxColumns;}
  getRange(...args){return new Range(this,...args);}
  insertColumnsAfter(after,count){assert.equal(state.locked,true);assert.equal(after,this.maxColumns);if(state.failExpand)throw Error('mock expand failure');this.maxColumns+=count;state.expansions.push({after,count});}
 }
 sheets.Responses=new Sheet([upgraded?headers:previousHeaders,...rows],columns??(upgraded?totalWidth:priorWidth));
 const props={SPREADSHEET_ID:'offline_spreadsheet_12345678901234567890',RETURN_URL:'https://example.github.io/survey/'};
 const ctx=vm.createContext({
  console:{log:s=>state.logs.push(s),warn:s=>state.logs.push(s)},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},
  LockService:{getScriptLock:()=>({waitLock(){if(state.locked)throw Error('mock lock busy');state.locked=true;},releaseLock(){assert.equal(state.locked,true);state.locked=false;}})},
  SpreadsheetApp:{openById(id){assert.equal(id,props.SPREADSHEET_ID);return {getSheetByName:name=>sheets[name]||null,insertSheet(){throw Error('Must not create any table');},deleteSheet(){throw Error('Must not delete any table');}};},flush(){state.flushes++;if(state.failFlushAt===state.flushes)throw Error('mock flush failure');},newRichTextValue:()=>({setText(text){this.text=text;return this;},build(){return {text:this.text};}})},
  Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(a,s,e)=>[...crypto.createHash(a).update(s,e).digest()]},
  HtmlService:{createHtmlOutput:html=>({html,setTitle(){return this;},addMetaTag(){return this;}})}
 });
 vm.runInContext(source,ctx);
 const submit=p=>{const payload=JSON.stringify(p);return ctx.doPost({contentLength:Buffer.byteLength(new URLSearchParams({payload}).toString()),parameter:{payload},parameters:{payload:[payload]}}).html;};
 const cell=(field,row=1)=>sheets.Responses.data[row][headers.indexOf(field)];
 return {ctx,state,sheets,props,submit,cell};
}
const originalPrefix=h=>h.sheets.Responses.getRange(1,1,h.sheets.Responses.getLastRow(),priorWidth).getDisplayValues();


test('413 headers preserve the entire frozen 217 prefix and append all 3.1 fields in an isolated namespace',()=>{
 assert.equal(totalWidth,413);assert.equal(new Set(headers).size,413);assert.deepEqual(headers.slice(0,priorWidth),previousHeaders);
 const fields=currentSchema.sections.flatMap(s=>s.questions).flatMap(q=>q.exportFields);
 assert.equal(fields.length,98);assert.deepEqual(headers.slice(priorWidth),fields.flatMap(f=>['v3_1__'+f,'v3_1__'+f+'__asked']));
 assert.deepEqual(previousHeaders,clone(oracles['2.4'].backendHeaders_()));assert.equal(harness().ctx.sourceHeaders_('3.1').length,203);
});
test('all 2.2, 2.3, 2.4 and 3.1 engine source is frozen exactly, including functions not exported from the IIFE',()=>{
 const normalize=s=>s.replace(/\r\n/g,'\n').trim();
 for(const version of ['2.2','2.3','2.4','3.1']){
  const embedded=source.split('"'+version+'":(function(){')[1].split('return Object.freeze({schema:SURVEY_SCHEMA')[0];
  const oracle=['2.4','3.1'].includes(version)?oracleSources[version].split('"'+version+'":(function(){')[1].split('return Object.freeze({schema:SURVEY_SCHEMA')[0]:oracleSources[version].split('/* Google Sheets receiver')[0];
  assert.equal(normalize(embedded),normalize(oracle));
 }
 assert.equal(sha(previous24),'d849cd5c4e7a5f65b587f5e76f68263d1a42d9fb2a81def87ef4d3bbf92a4811');
});
test('all five versions preserve canonical answers and digest over 180 meaningful route combinations',()=>{
 const h=harness();let checked=0;
 for(const version of ['2.2','2.3','2.4','3.1','3.2'])for(const S of [1,2,5])for(const B of [1,2,5])for(const experience of [false,true])for(const charge of [1,5]){
  const overrides=['3.1','3.2'].includes(version)?{Q18_S:S,Q18_B:B,Q13:experience?1:0,Q29:charge,Q26_S:1,Q26_B:4,Q15:[4],Q15__4_text:'source',Q28_B:[3],Q28_B__3_text:'weekly'}:
   {Q16_S:S,Q16_B:B,Q12:experience?2:1,Q22:charge,Q27_S:1,Q27_B:4,Q13:[4],Q13__4_text:'source',Q29_B:[3],Q29_B__3_text:'weekly'};
  const p=packet(version,overrides),actual=h.ctx.canonicalRecord_(p),expected=expectedRecord(p);
  assert.deepEqual(clone(actual),clone(expected));assert.equal(digest(actual),digest(expected));checked++;
 }
 assert.equal(checked,180);
});
test('same names never mix meanings: all 210 old value/asked cells are absent for 3.1, all 196 new cells absent for old versions',()=>{
 const h=harness();
 for(const [row,version] of ['2.2','2.3','2.4','3.1','3.2'].entries()){
  const p=packet(version);assert.match(h.submit(p),/has been saved/);const actual=h.sheets.Responses.data[row+1],expected=rowFor(p,totalWidth);
  for(let col=0;col<totalWidth;col++)if(col!==1)assert.equal(actual[col],expected[col],version+' '+headers[col]);
  const unrelated=['3.1','3.2'].includes(version)?headers.slice(7,priorWidth):headers.slice(priorWidth);
  for(const field of unrelated)assert.equal(h.cell(field,row+1),field.endsWith('__asked')?'0':'',version+' '+field);
 }
 assert.equal(h.cell('V_Q24_S',1),'0.5');assert.equal(h.cell('V_Q24_band_S',2),'0');
 assert.equal(h.cell('v3_1__V_Q3',4),'8');assert.equal(h.cell('v3_1__V_Q14',4),'1');assert.equal(h.cell('V_Q14',4),'');
});
test('storage prefix affects physical projection only, never raw answers, frontend exports, or digest',()=>{
 const h=harness(),p=packet('3.1'),r=h.ctx.canonicalRecord_(p);
 assert.ok(Object.keys(r.flat).every(key=>!key.startsWith('v3_1__')));assert.equal(r.answers.Q3,8);assert.equal(r.flat.V_Q3,8);
 p.flat={'V_Q14':999,'v3_1__V_Q14':999};p.asked={Q14:false};assert.match(h.submit(p),/has been saved/);
 assert.equal(h.cell('v3_1__V_Q14'),'1');assert.equal(h.cell('payload_sha256'),digest(expectedRecord(p)));
 const illegal=packet('3.1');illegal.answers.v3_1__Q3=1;assert.match(h.submit(illegal),/unknown question/);
});
test('3.1 Q3 Other is required, bounded, exported, formula-safe, and cleared when another level is selected',()=>{
 const h=harness();for(const text of ['', ' ', 'x'.repeat(41)])assert.match(h.submit(packet('3.1',{Q3:8,Q3__8_text:text})),/could not be saved/);
 assert.equal(h.state.writes.length,0);
 for(const value of [8,'8'])assert.match(h.submit(packet('3.1',{Q3:value,Q3__8_text:'x'.repeat(40)})),/has been saved/);
 assert.equal(h.cell('v3_1__V_Q3_Other_txt'),'x'.repeat(40));assert.equal(h.cell('v3_1__V_Q3_Other_txt__asked'),'1');
 assert.match(h.submit(packet('3.1',{Q3:8,Q3__8_text:'=private text'})),/has been saved/);assert.equal(h.cell('v3_1__V_Q3_Other_txt',3),"'=private text");
 const changed=packet('3.1',{Q3:1,Q3__8_text:'stale'});const record=h.ctx.canonicalRecord_(changed);assert.equal(record.answers.Q3__8_text,undefined);
 assert.match(h.submit(changed),/has been saved/);assert.equal(h.cell('v3_1__V_Q3_Other_txt',4),'');assert.equal(h.cell('v3_1__V_Q3_Other_txt__asked',4),'0');
});
test('3.1 experience is controlled only by Q13 Yes, and cleans payment/location/reliability including Other',()=>{
 const h=harness();
 for(const value of [1,'1']){
  const p=packet('3.1',{Q13:value,Q14:4,Q15:[4],Q15__4_text:'Other campus',Q16:5}),r=h.ctx.canonicalRecord_(p);
  assert.equal(r.asked.Q14,true);assert.equal(r.asked.Q15,true);assert.equal(r.asked.Q16,true);assert.match(h.submit(p),/has been saved/);
 }
 const no=packet('3.1',{Q13:0,Q14:4,Q15:[4],Q15__4_text:'stale',Q16:5}),r=h.ctx.canonicalRecord_(no);
 for(const key of ['Q14','Q15','Q16','Q15__4_text'])assert.equal(r.answers[key],undefined,key);
 for(const q of ['Q14','Q15','Q16'])assert.equal(r.asked[q],false);
 for(const value of [2,99,'',null])assert.match(h.submit(packet('3.1',{Q13:value})),/could not be saved/);
});
test('3.1 uses Q18 interest and Q26 plan choice independently for each product',()=>{
 const h=harness();
 const p=packet('3.1',{Q18_S:5,Q18_B:1,Q26_S:4,Q28_S:[3],Q28_S__3_text:'daily plan',Q26_B:1,Q27_B:[7],Q27_B__7_text:'stale'}),r=h.ctx.canonicalRecord_(p);
 for(const key of ['Q24','Q25_S','Q26_S','Q28_S','Q31','Q32','Q19_B'])assert.equal(r.asked[key],true,key);
 for(const key of ['Q25_B','Q26_B','Q27_B','Q28_B','Q19_S'])assert.equal(r.asked[key],false,key);
 assert.equal(r.answers.Q27_B__7_text,undefined);
 const changed=packet('3.1',{Q18_S:5,Q18_B:1,Q26_S:1,Q27_S:[1],Q28_S:[3],Q28_S__3_text:'stale'}),chosen=h.ctx.canonicalRecord_(changed);
 assert.equal(chosen.asked.Q27_S,true);assert.equal(chosen.asked.Q28_S,false);assert.equal(chosen.answers.Q28_S__3_text,undefined);
 const none=packet('3.1',{Q18_S:1,Q18_B:1,Q12:0,Q24:0}),neither=h.ctx.canonicalRecord_(none);
 assert.equal(neither.asked.Q12,true);assert.equal(neither.flat.V_Q12_band,0);assert.equal(neither.asked.Q24,false);assert.equal(neither.asked.Q31,false);
});
test('3.1 charging is Q29 and Q30 categories reject obsolete 99, zero code, and numeric amounts',()=>{
 const h=harness();for(const value of [1,2,3,4,5])assert.match(h.submit(packet('3.1',{Q29:5,Q30:value})),/has been saved/);
 for(const value of [0,99,1.5,6])assert.match(h.submit(packet('3.1',{Q29:5,Q30:value})),/could not be saved/);
 const r=h.ctx.canonicalRecord_(packet('3.1',{Q29:1,Q30:99}));assert.equal(r.answers.Q30,undefined);assert.equal(r.asked.Q30,false);
 const q=currentSchema.sections.flatMap(s=>s.questions).find(q=>q.id==='Q30');assert.equal(q.options[0].interval.lower,0);assert.equal(q.options[0].interval.lowerInclusive,true);
});
test('combined 3.1 weekly usage preserves explicit zero and does not force pricing skips',()=>{
 const h=harness();const p=packet('3.1',{Q18_S:5,Q18_B:1,Q24:0,Q25_S:1,Q26_S:4}),r=h.ctx.canonicalRecord_(p);
 assert.equal(r.flat.V_Q24_band,0);assert.equal(r.asked.Q26_S,true);assert.match(h.submit(p),/has been saved/);assert.equal(h.cell('v3_1__V_Q24_band'),'0');assert.equal(h.cell('v3_1__V_Q24_band__asked'),'1');
 for(const v of [99,.5,6])assert.match(h.submit(packet('3.1',{Q24:v})),/could not be saved/);
 assert.match(h.submit(packet('3.1',{Q24_S:1})),/unknown question/);
});
test('legacy 2.4 exclusive None and Q14 unknown retain their old semantics',()=>{
 const h=harness();assert.match(h.submit(packet('2.4',{Q8:[9],Q14:99})),/has been saved/);assert.equal(h.cell('V_Q8_9'),'1');assert.equal(h.cell('V_Q14'),'');assert.equal(h.cell('V_Q14__asked'),'1');
 assert.match(h.submit(packet('2.4',{Q8:[9,1]})),/could not be saved/);
 for(const v of ['2.2','2.3'])assert.match(h.submit(packet(v,{Q8:[9]})),/could not be saved/);
 assert.match(h.submit(packet('3.1',{Q8:[9]})),/could not be saved/);assert.match(h.submit(packet('3.1',{Q14:99})),/could not be saved/);
});
test('unsupported versions and prototype names reject before storage',()=>{
 const h=harness();for(const version of ['2.0','2.1','3.0','3.3','__proto__','constructor','toString',3.1,null]){const p=packet('3.1');p.schemaVersion=version;assert.match(h.submit(p),/version is no longer accepted/);}
 assert.equal(h.state.writes.length,0);
});

test('setup validates only exact 413 headers and never writes or creates a table',()=>{
 const h=harness();assert.deepEqual(clone(h.ctx.setupSurveySheet()),{columns:totalWidth,mutated:false});assert.equal(h.state.writes.length,0);
 const old=harness({upgraded:false});assert.throws(()=>old.ctx.setupSurveySheet());assert.equal(old.state.writes.length,0);
 delete h.sheets.Responses;assert.throws(()=>h.ctx.setupSurveySheet());assert.equal(h.state.writes.length,0);
 assert.doesNotMatch(source,/\.insertSheet\(|\.deleteSheet\(|\.setName\(/);assert.equal(h.ctx.consolidateResponses,undefined);
});
test('before upgrade all three previous versions write exactly 217 columns and 3.1 is refused',()=>{
 const h=harness({upgraded:false});for(const v of ['2.2','2.3','2.4'])assert.match(h.submit(packet(v)),/has been saved/);
 assert.equal(h.state.writes.length,3);assert.ok(h.state.writes.every(w=>w.width===priorWidth));assert.match(h.submit(packet('3.1')),/not ready/);assert.equal(h.state.writes.length,3);
});
test('malformed or missing unified headers never divert submissions into any other table',()=>{
 for(const alteration of [h=>h.sheets.Responses.data[0][0]='wrong',h=>h.sheets.Responses.data[0][217]='unknown',h=>{h.sheets.Responses.maxColumns=totalWidth+1;h.sheets.Responses.data[0][totalWidth]='unexpected';},h=>delete h.sheets.Responses]){
  const h=harness();alteration(h);for(const v of ['2.2','2.3','2.4','3.1','3.2'])assert.match(h.submit(packet(v)),/could not be saved/);assert.equal(h.state.writes.length,0);
 }
});
test('append-only upgrade preserves every old cell including digest/formula text and blank row gaps',()=>{
 const rows=[rowFor(packet('2.2',{Q33:'=formula text'})),[],rowFor(packet('2.3'))],h=harness({upgraded:false,rows}),before=originalPrefix(h);
 const result=h.ctx.upgradeUnifiedHeaders();assert.equal(result.historicalRows,2);assert.equal(result.priorColumnsUnchanged,true);assert.equal(h.state.locked,false);
 assert.deepEqual(originalPrefix(h),before);assert.deepEqual(h.sheets.Responses.data[0],headers);assert.equal(h.cell(firstNew+'__asked',1),'0');assert.equal(h.cell(firstNew+'__asked',2),'');assert.equal(h.cell(firstNew+'__asked',3),'0');
 assert.ok(h.state.writes.every(w=>w.column===218&&w.width===extraWidth));assert.deepEqual(h.state.expansions,[{after:priorWidth,count:extraWidth}]);
 assert.match(h.submit(packet('3.1')),/has been saved/);
});
test('empty table upgrades only the new headers and does not invent response rows',()=>{
 const h=harness({upgraded:false}),before=originalPrefix(h);h.ctx.upgradeUnifiedHeaders();assert.deepEqual(originalPrefix(h),before);assert.equal(h.sheets.Responses.getLastRow(),1);assert.deepEqual(h.state.writes,[{row:1,column:218,count:1,width:extraWidth}]);
});
test('existing spare columns are reused without adding columns or changing any old cells',()=>{
 const h=harness({upgraded:false,rows:[rowFor(packet('2.3'))],columns:totalWidth+13}),before=originalPrefix(h);h.ctx.upgradeUnifiedHeaders();assert.deepEqual(originalPrefix(h),before);assert.equal(h.state.expansions.length,0);
});
test('completed upgrade retries are read-only, including after new 3.1 rows arrive',()=>{
 const h=harness({upgraded:false,rows:[rowFor(packet('2.2')),rowFor(packet('2.3'))]});h.ctx.upgradeUnifiedHeaders();h.submit(packet('3.1'));
 const before=clone(h.sheets.Responses.data),writes=h.state.writes.length;assert.equal(h.ctx.upgradeUnifiedHeaders().alreadyComplete,true);assert.deepEqual(h.sheets.Responses.data,before);assert.equal(h.state.writes.length,writes);
});
test('duplicate old receipt survives upgrade without changing original timestamp or digest',()=>{
 const p=packet('2.3'),row=rowFor(p),h=harness({upgraded:false,rows:[row]});h.ctx.upgradeUnifiedHeaders();const before=clone(h.sheets.Responses.data);
 const html=h.submit(p);assert.match(html,/already received/);assert.ok(html.includes(row[1]));assert.deepEqual(h.sheets.Responses.data,before);
});
test('expansion, data-write, and readback failures preserve old cells and safely retry',()=>{
 for(const flag of ['failExpand','failWrite','throwAfterExtraWrite','corruptExtraRead']){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.2'))]}),before=originalPrefix(h);h.state[flag]=true;assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.deepEqual(originalPrefix(h),before);assert.equal(h.state.locked,false);
  h.state[flag]=false;assert.match(h.submit(packet('3.1')),/not ready/);assert.equal(h.ctx.upgradeUnifiedHeaders().columns,totalWidth);assert.deepEqual(originalPrefix(h),before);
 }
});
test('a failed or partial final header write lets old submissions continue, then retry includes them',()=>{
 for(const flag of ['failHeaderWrite','partialHeaderFailure']){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.2'))]});h.state[flag]=true;assert.throws(()=>h.ctx.upgradeUnifiedHeaders());h.state[flag]=false;
  assert.match(h.submit(packet('3.1')),/not ready/);assert.match(h.submit(packet('2.3')),/has been saved/);const before=originalPrefix(h);
  h.ctx.upgradeUnifiedHeaders();assert.deepEqual(originalPrefix(h),before);assert.equal(h.cell(firstNew+'__asked',2),'0');
 }
});
test('flush failure before or after header commit retries without modifying old cells',()=>{
 for(const flush of [1,2]){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.3'))]}),before=originalPrefix(h);h.state.failFlushAt=flush;assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.deepEqual(originalPrefix(h),before);
  h.state.failFlushAt=0;const result=h.ctx.upgradeUnifiedHeaders();assert.equal(result.alreadyComplete,flush===2);assert.deepEqual(originalPrefix(h),before);
 }
});
test('multiple batches initialize only new columns and a retry keeps all 501 prior rows',()=>{
 const rows=Array.from({length:501},()=>rowFor(packet('2.3'))),h=harness({upgraded:false,rows}),before=originalPrefix(h);h.state.boundReads=true;h.ctx.upgradeUnifiedHeaders();h.state.boundReads=false;
 assert.deepEqual(originalPrefix(h),before);assert.deepEqual(h.state.writes.filter(w=>w.row>1).map(w=>w.count),[100,100,100,100,100,1]);
 for(let i=1;i<=501;i++){assert.equal(h.cell(firstNew,i),'');assert.equal(h.cell(firstNew+'__asked',i),'0');}
 assert.equal(h.ctx.upgradeUnifiedHeaders().historicalRows,501);
});
test('same script lock prevents a concurrent submission or upgrade from crossing the commit point',()=>{
 const h=harness({upgraded:false,rows:[rowFor(packet('2.2'))]}),p=packet('2.3');
 h.state.onExtraWrite=()=>{assert.match(h.submit(p),/could not be saved/);assert.throws(()=>h.ctx.upgradeUnifiedHeaders(),/lock busy/);};
 h.ctx.upgradeUnifiedHeaders();assert.match(h.submit(p),/has been saved/);assert.equal(h.sheets.Responses.getLastRow(),3);assert.equal(h.state.locked,false);
});
test('external change to an old cell or response count is detected before headers commit',()=>{
 for(const edit of [h=>h.sheets.Responses.data[1][8]='manual change',h=>h.sheets.Responses.data.push(rowFor(packet('2.3')))]){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.2'))]});h.state.onExtraWrite=()=>edit(h);assert.throws(()=>h.ctx.upgradeUnifiedHeaders(),/readback failed/);
  assert.notDeepEqual(h.sheets.Responses.data[0],headers);assert.match(h.submit(packet('3.1')),/not ready/);const updated=originalPrefix(h);h.ctx.upgradeUnifiedHeaders();assert.deepEqual(originalPrefix(h),updated);
 }
});
test('unknown new-column contents or unexpected historical version are never overwritten',()=>{
 for(const alter of [h=>{h.sheets.Responses.data[1][217]='1';},h=>{h.sheets.Responses.data[1][218]='1';},h=>{h.sheets.Responses.data[1][2]='3.1';},h=>{h.sheets.Responses.data[0][217]='incorrect';}]){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.3'))],columns:totalWidth});alter(h);const before=clone(h.sheets.Responses.data);assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.deepEqual(clone(h.sheets.Responses.data),before);assert.equal(h.state.writes.length,0);
 }
});
test('same ID same digest is idempotent while changed answers or changed version cannot overwrite',()=>{
 const h=harness(),p=packet('3.1');assert.match(h.submit(p),/has been saved/);const before=clone(h.sheets.Responses.data);assert.match(h.submit(p),/already received/);assert.deepEqual(h.sheets.Responses.data,before);
 p.answers.Q8=[2];assert.match(h.submit(p),/different answers/);assert.deepEqual(h.sheets.Responses.data,before);
 const old=packet('2.3');old.responseId=p.responseId;assert.match(h.submit(old),/different answers/);assert.deepEqual(h.sheets.Responses.data,before);
});
test('submission write/flush failures never fake success and retries are safe',()=>{
 const h=harness(),p=packet('3.1');h.state.failWrite=true;assert.match(h.submit(p),/could not be saved/);assert.equal(h.sheets.Responses.getLastRow(),1);assert.equal(h.state.locked,false);
 h.state.failWrite=false;h.state.failFlushAt=1;assert.match(h.submit(p),/could not be saved/);assert.equal(h.sheets.Responses.getLastRow(),2);h.state.failFlushAt=0;assert.match(h.submit(p),/already received/);assert.equal(h.sheets.Responses.getLastRow(),2);
});
test('formula safety, privacy, malformed payload rejection, and trusted return links remain intact',()=>{
 const h=harness(),p=packet('3.1',{Q33:'=IMPORTDATA("private")'});assert.match(h.submit(p),/has been saved/);assert.equal(h.cell('v3_1__V_Q33'),"'=IMPORTDATA(\"private\")");
 const get=h.ctx.doGet().html;assert.ok(!get.includes('IMPORTDATA'));assert.ok(!get.includes(h.props.SPREADSHEET_ID));
 for(const version of ['2.2','2.3','2.4','3.1','3.2'])for(const patch of [{Q1:0},{UNAUTHORIZED:'x'},{Q2:{}},{Q24_S:[1]},{Q20_S:''}])assert.match(h.submit(packet(version,patch)),/could not be saved/);
 const attacker=packet('3.1');attacker.returnUrl='https://attacker.invalid';const html=h.submit(attacker);assert.match(html,/unsupported fields/);assert.ok(!html.includes('attacker.invalid'));assert.ok(!h.state.logs.some(s=>s.includes('IMPORTDATA')));
});
test('the release has exactly one deployable Apps Script source file',()=>{
 assert.deepEqual(fs.readdirSync(root).filter(name=>name.endsWith('.gs')),['UnifiedCollector.gs']);
});

test('upgrade fills every one of the 196 added cells correctly for all three historical versions',()=>{
 const rows=['2.2','2.3','2.4'].map(v=>rowFor(packet(v))),h=harness({upgraded:false,rows}),before=originalPrefix(h);
 h.ctx.upgradeUnifiedHeaders();assert.deepEqual(originalPrefix(h),before);
 for(let row=1;row<=3;row++)for(const field of headers.slice(priorWidth))assert.equal(h.cell(field,row),field.endsWith('__asked')?'0':'',field);
});
test('failure between upgrade batches safely resumes and includes an intervening old-version response',()=>{
 const h=harness({upgraded:false,rows:Array.from({length:205},()=>rowFor(packet('2.4')))}),before=originalPrefix(h);
 h.state.onExtraWrite=()=>{h.state.failWrite=true;};assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.deepEqual(originalPrefix(h),before);
 h.state.failWrite=false;assert.match(h.submit(packet('3.1')),/not ready/);assert.match(h.submit(packet('2.4')),/has been saved/);
 const afterLegacyWrite=originalPrefix(h);h.ctx.upgradeUnifiedHeaders();assert.deepEqual(originalPrefix(h),afterLegacyWrite);assert.equal(h.sheets.Responses.getLastRow(),207);
 for(let row=1;row<=206;row++)for(const field of headers.slice(priorWidth))assert.equal(h.cell(field,row),field.endsWith('__asked')?'0':'');
});

test('screenshot backend 1: Q1 No clears later answers and cannot write any row',()=>{
 const h=harness(),p=packet('3.1',{Q1:0}),engine=h.ctx.engineForVersion_('3.1');
 assert.deepEqual(clone(engine.cleanAnswers(engine.schema,p.answers)),{Q1:0});assert.match(h.submit(p),/could not be saved/);assert.equal(h.state.writes.length,0);
});
test('screenshot backend 2: Q13 No skips Q14-Q16 and keeps liking/interest questions',()=>{
 const h=harness(),p=packet('3.1',{Q13:0,Q14:4,Q15:[4],Q15__4_text:'stale',Q16:5}),r=h.ctx.canonicalRecord_(p);
 for(const id of ['Q14','Q15','Q16'])assert.equal(r.asked[id],false);
 for(const id of ['Q13','Q17_S','Q17_B','Q18_S','Q18_B'])assert.equal(r.asked[id],true);
 assert.match(h.submit(p),/has been saved/);assert.equal(h.cell('v3_1__V_Q14__asked'),'0');assert.equal(h.cell('v3_1__V_Q15_Other_txt'),'');
});
test('screenshot backend 3: Q19 is stored only for each product rated uninterested',()=>{
 const h=harness();for(const [S,B] of [[1,5],[5,1],[5,5],[1,1]]){
  const r=h.ctx.canonicalRecord_(packet('3.1',{Q18_S:S,Q18_B:B}));
  assert.equal(r.asked.Q19_S,S===1);assert.equal(r.asked.Q19_B,B===1);
 }
});
test('screenshot backend 4: both uninterested skip Q24-Q28 and Q31-Q32 but keep charger and comment',()=>{
 const h=harness(),r=h.ctx.canonicalRecord_(packet('3.1',{Q18_S:1,Q18_B:1,Q29:5}));
 for(const key of ['Q24','Q25_S','Q25_B','Q26_S','Q26_B','Q27_S','Q27_B','Q28_S','Q28_B','Q31','Q32'])assert.equal(r.asked[key],false,key);
 for(const key of ['Q19_S','Q19_B','Q20','Q21_S','Q21_B','Q22_S','Q22_B','Q23_S','Q23_B','Q29','Q30','Q33'])assert.equal(r.asked[key],true,key);
});
test('screenshot backend 5: all 16 S/B plan combinations show only the corresponding Q27 or Q28',()=>{
 const h=harness();for(const S of [1,2,3,4])for(const B of [1,2,3,4]){
  const p=packet('3.1',{Q18_S:5,Q18_B:5,Q26_S:S,Q26_B:B}),r=h.ctx.canonicalRecord_(p);
  for(const [product,code] of [['S',S],['B',B]]){assert.equal(r.asked['Q27_'+product],code<4);assert.equal(r.asked['Q28_'+product],code===4);}
  assert.match(h.submit(p),/has been saved/);
 }
});
test('screenshot backend 6: Q29=1 removes stale Q30 independently of product interest',()=>{
 const h=harness(),p=packet('3.1',{Q18_S:5,Q18_B:5,Q29:1,Q30:5}),r=h.ctx.canonicalRecord_(p);
 assert.equal(r.answers.Q30,undefined);assert.equal(r.asked.Q30,false);assert.equal(r.asked.Q26_S,true);
 assert.match(h.submit(p),/has been saved/);assert.equal(h.cell('v3_1__V_Q30_band'),'');assert.equal(h.cell('v3_1__V_Q30_band__asked'),'0');
});
test('screenshot backend 7: both scalar Q3 Other and multi Q8 Other are mandatory and clear on deselection',()=>{
 const h=harness();for(const id of ['Q3','Q8']){
  const detail=id+'__8_text',selection=id==='Q3'?8:[8];
  assert.match(h.submit(packet('3.1',{[id]:selection,[detail]:''})),/could not be saved/);
  const p=packet('3.1',{[id]:selection,[detail]:'Specified other'}),r=h.ctx.canonicalRecord_(p);assert.equal(r.flat['V_'+id+'_Other_txt'],'Specified other');assert.match(h.submit(p),/has been saved/);
  const changed=h.ctx.canonicalRecord_(packet('3.1',{[id]:id==='Q3'?1:[1],[detail]:'stale'}));assert.equal(changed.answers[detail],undefined);assert.equal(changed.flat['V_'+id+'_Other_txt'],'');
 }
});
test('screenshot backend 8: per-product price definitions and stable plan codes/order survive server canonicalization',()=>{
 const h=harness(),schema=h.ctx.engineForVersion_('3.1').schema;
 assert.deepEqual(clone(schema.plansByProduct.S.map(p=>p.price)),['$0.25 per minute','$39.99 per month','$14.99 per month']);
 assert.deepEqual(clone(schema.plansByProduct.B.map(p=>p.price)),['$0.20 per minute','$31.99 per month','$11.99 per month']);
 assert.match(schema.plansByProduct.S[1].description,/45 minutes/);assert.match(schema.plansByProduct.B[1].description,/60 minutes/);
 assert.match(schema.plansByProduct.S[2].description,/\$0\.20 per extra minute/);assert.match(schema.plansByProduct.B[2].description,/\$0\.16 per extra minute/);
 for(const order of [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]){
  const p=packet('3.1',{Q18_S:5,Q18_B:5,Q26_S:2,Q26_B:4});p.planOrder=order;const r=h.ctx.canonicalRecord_(p);
  assert.deepEqual(clone(r.planOrder),order.map(String));assert.equal(r.flat.V_Q26_S,2);assert.equal(r.flat.V_Q26_B,4);assert.match(h.submit(p),/has been saved/);
 }
 const bad=packet('3.1');bad.planOrder=[1,2,4];assert.match(h.submit(bad),/display order is invalid/);
});

test('3.2 preserves all 413 physical headers exactly and shares only the existing 3.1 namespace',()=>{
 assert.equal(sha(previous31),'686437dd3502f736606aab24fe4b2ebd43115f1e4b249e34829768938f7ee074');
 assert.deepEqual(headers,JSON.parse(fs.readFileSync(path.join(root,'testing/fixtures/previous-release-headers.json'),'utf8')));
 assert.deepEqual(headers,clone(oracles['3.1'].backendHeaders_()));
 const h=harness();assert.deepEqual(clone(h.ctx.sourceHeaders_('3.2')),clone(h.ctx.sourceHeaders_('3.1')));
 assert.deepEqual(clone(h.ctx.engineForVersion_('3.2').schema),currentSchema);
 for(const field of headers.slice(217)){assert.ok(field.startsWith('v3_1__'));assert.ok(!field.startsWith('v3_2__'));}
 for(const v of ['3.1','3.2'])assert.equal(h.ctx.storedFieldName_(v,'V_Q6'),'v3_1__V_Q6');
});

test('3.2 Q6 is required only for eligible on-campus residents and stale off-campus answers are removed',()=>{
 const h=harness();
 for(const residence of [1,'1'])for(const distance of [1,2,3,4,5,'1','5']){
  const r=h.ctx.canonicalRecord_(packet('3.2',{Q5:residence,Q6:distance}));
  assert.equal(r.asked.Q6,true);assert.equal(r.flat.V_Q6,Number(distance));assert.equal(r.flat.V_Q6__asked,1);
 }
 for(const residence of [2,3,'2','3'])for(const stale of [99,5,'1']){
  const p=packet('3.2',{Q5:residence,Q6:stale}),r=h.ctx.canonicalRecord_(p);
  assert.equal(r.asked.Q6,false);assert.equal(r.answers.Q6,undefined);assert.equal(r.flat.V_Q6,'');assert.equal(r.flat.V_Q6__asked,0);
  assert.match(h.submit(p),/has been saved/);
 }
 for(const invalid of [0,6,99,'99',1.5,'',null])assert.match(h.submit(packet('3.2',{Q5:1,Q6:invalid})),/could not be saved/);
 const missing=packet('3.2',{Q5:1});delete missing.answers.Q6;assert.match(h.submit(missing),/Q6/);
});

test('3.2 on-campus routing rejects malformed residence codes instead of making new distance obligations',()=>{
 const h=harness();
 for(const Q5 of [0,4,99,'',null,true,[1],{}]){
  const p=packet('3.2',{Q5,Q6:1});assert.match(h.submit(p),/could not be saved/);
 }
 assert.equal(h.state.writes.length,0);
 for(const Q1 of [0,'0']){
  const p=packet('3.2',{Q1,Q5:1,Q6:5});assert.match(h.submit(p),/could not be saved/);
  const engine=h.ctx.engineForVersion_('3.2');assert.deepEqual(clone(engine.cleanAnswers(engine.schema,p.answers)),{Q1});
 }
});

test('3.1 Q6 remains all-eligible with NA99 while 3.2 on-campus Q6 rejects NA99',()=>{
 const h=harness();
 const old=h.ctx.canonicalRecord_(packet('3.1',{Q5:2,Q6:99}));
 assert.equal(old.answers.Q6,99);assert.equal(old.asked.Q6,true);assert.equal(old.flat.V_Q6,'');assert.equal(old.flat.V_Q6__asked,1);
 const current=h.ctx.canonicalRecord_(packet('3.2',{Q5:2,Q6:99}));
 assert.equal(current.answers.Q6,undefined);assert.equal(current.asked.Q6,false);assert.equal(current.flat.V_Q6,'');assert.equal(current.flat.V_Q6__asked,0);
 assert.match(h.submit(packet('3.1',{Q5:1,Q6:99})),/has been saved/);
 assert.match(h.submit(packet('3.2',{Q5:1,Q6:99})),/could not be saved/);
});

test('3.2 Q31 remains required for both-uninterested respondents while Q32 and pricing remain hidden',()=>{
 const h=harness();
 for(const value of [0,1,10,'0','10']){
  const p=packet('3.2',{Q18_S:1,Q18_B:1,Q31:value,Q32:1,Q24:0,Q26_S:4,Q26_B:4}),r=h.ctx.canonicalRecord_(p);
  assert.equal(r.asked.Q31,true);assert.equal(r.flat.V_Q31,Number(value));assert.equal(r.flat.V_Q31__asked,1);
  for(const key of ['Q24','Q25_S','Q25_B','Q26_S','Q26_B','Q27_S','Q27_B','Q28_S','Q28_B','Q32']){assert.equal(r.asked[key],false);assert.equal(r.answers[key],undefined);}
  assert.match(h.submit(p),/has been saved/);
 }
 for(const invalid of ['',null,-1,11,0.5,99])assert.match(h.submit(packet('3.2',{Q18_S:1,Q18_B:1,Q31:invalid})),/could not be saved/);
 const missing=packet('3.2',{Q18_S:1,Q18_B:1});delete missing.answers.Q31;assert.match(h.submit(missing),/Q31/);
 const old=h.ctx.canonicalRecord_(packet('3.1',{Q18_S:1,Q18_B:1,Q31:10}));assert.equal(old.asked.Q31,false);assert.equal(old.answers.Q31,undefined);
});

test('3.2 108 residence/product/experience/charger route cases retain independent Q6 and Q31 behavior',()=>{
 const h=harness();let cases=0;
 for(const Q5 of [1,2,3])for(const S of [1,2,5])for(const B of [1,2,5])for(const Q13 of [0,1])for(const Q29 of [1,5]){
  const p=packet('3.2',{Q5,Q6:3,Q18_S:S,Q18_B:B,Q13,Q29,Q31:0}),r=h.ctx.canonicalRecord_(p);
  assert.deepEqual(clone(r),clone(expectedRecord(p)));assert.equal(r.asked.Q6,Q5===1);assert.equal(r.asked.Q31,true);assert.equal(r.flat.V_Q31,0);
  assert.equal(r.asked.Q14,Q13===1);assert.equal(r.asked.Q30,Q29===5);assert.equal(r.asked.Q32,S!==1||B!==1);
  assert.equal(r.asked.Q19_S,S===1);assert.equal(r.asked.Q19_B,B===1);cases++;
 }
 assert.equal(cases,108);
});

test('setup and repeated upgrade are read-only for the live 413 layout with both 3.1 and 3.2 rows',()=>{
 const rows=['2.2','2.3','2.4','3.1','3.2'].map(v=>rowFor(packet(v),totalWidth)),h=harness({rows}),before=clone(h.sheets.Responses.data);
 for(let attempt=0;attempt<2;attempt++){
  assert.equal(h.ctx.setupSurveySheet().mutated,false);assert.equal(h.ctx.upgradeUnifiedHeaders().alreadyComplete,true);
 }
 assert.deepEqual(h.sheets.Responses.data,before);assert.equal(h.state.writes.length,0);assert.equal(h.state.expansions.length,0);assert.equal(h.state.locked,false);
});

test('3.2 is refused on incomplete 217-column headers but works after safe historical recovery',()=>{
 const h=harness({upgraded:false,rows:[rowFor(packet('2.4'))]}),p=packet('3.2'),before=originalPrefix(h);
 assert.match(h.submit(p),/not ready/);assert.deepEqual(originalPrefix(h),before);assert.equal(h.state.writes.length,0);
 h.state.partialHeaderFailure=true;assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.match(h.submit(p),/not ready/);
 h.state.partialHeaderFailure=false;h.ctx.upgradeUnifiedHeaders();assert.deepEqual(originalPrefix(h),before);assert.match(h.submit(p),/has been saved/);assert.equal(h.cell('survey_version',2),'3.2');
});

test('3.1 and 3.2 are distinguishable by source version and digest despite shared physical columns',()=>{
 const h=harness(),old=packet('3.1',{Q5:1,Q6:1,Q18_S:5,Q18_B:5}),current=clone(old);current.schemaVersion='3.2';
 const a=h.ctx.canonicalRecord_(old),b=h.ctx.canonicalRecord_(current);
 assert.deepEqual(clone(a.answers),clone(b.answers));assert.notEqual(digest(a),digest(b));
 assert.match(h.submit(old),/has been saved/);const before=clone(h.sheets.Responses.data);assert.match(h.submit(current),/different answers/);assert.deepEqual(h.sheets.Responses.data,before);
 current.responseId=packet('3.2').responseId;assert.match(h.submit(current),/has been saved/);assert.equal(h.cell('survey_version',1),'3.1');assert.equal(h.cell('survey_version',2),'3.2');
 assert.equal(h.cell('v3_1__V_Q6',1),'1');assert.equal(h.cell('v3_1__V_Q6',2),'1');
});

test('3.2 receipt, duplicate, write-failure retry and formula-safe Other use the actual receiver',()=>{
 const h=harness(),p=packet('3.2',{Q5:2,Q6:99,Q3:8,Q3__8_text:'=private',Q18_S:1,Q18_B:1,Q31:0});
 h.state.failWrite=true;assert.match(h.submit(p),/could not be saved/);assert.equal(h.state.writes.length,0);
 h.state.failWrite=false;const html=h.submit(p);assert.match(html,/has been saved/);assert.ok(html.includes(p.responseId));
 assert.equal(h.cell('v3_1__V_Q3_Other_txt'),"'=private");assert.equal(h.cell('v3_1__V_Q6'),'');assert.equal(h.cell('v3_1__V_Q6__asked'),'0');assert.equal(h.cell('v3_1__V_Q31'),'0');assert.equal(h.cell('v3_1__V_Q31__asked'),'1');
 const before=clone(h.sheets.Responses.data);assert.match(h.submit(p),/already received/);assert.deepEqual(h.sheets.Responses.data,before);assert.ok(!h.ctx.doGet().html.includes('private'));
});
