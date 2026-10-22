/* Offline tests of the exact released UnifiedCollector.gs. No live requests or spreadsheet credentials. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../google-sheets'),source=fs.readFileSync(path.join(root,'UnifiedCollector.gs'),'utf8'),headers=JSON.parse(fs.readFileSync(path.join(root,'headers.json'),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x));
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const oracles={};
for(const v of ['2.2','2.3']){const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'testing','fixtures','original-'+v+'.gs.txt'),'utf8'),c);oracles[v]=c;}
const originalHeaders=v=>clone(oracles[v].backendHeaders_());
let id=100;
function packet(v,overrides={}){
 const p=JSON.parse(fs.readFileSync(path.join(root,'testing','qa','packet-'+v+'.json'),'utf8'));
 p.responseId='aaaaaaaa-aaaa-4aaa-8aaa-'+String(++id).padStart(12,'0');Object.assign(p.answers,overrides);
 const schema=JSON.parse(vm.runInContext('JSON.stringify(SURVEY_SCHEMA)',oracles[v]));
 for(let pass=0;pass<4;pass++)for(const {q,key} of oracles[v].expandedQuestions(schema,p.answers)){
  if(p.answers[key]!==undefined)continue;
  const t=q.type.replace('product_','');p.answers[key]=t==='text'?'TEST':t==='multi'?[q.options[0].value]:t==='single'?q.options[0].value:q.min||0;
 }
 return p;
}
function digest(record){return sha(JSON.stringify({version:record.schemaVersion,answers:record.answers,planOrder:record.planOrder}));}
function oldRow(p,time='2026-10-22T16:06:00.000Z'){
 const r=oracles[p.schemaVersion].canonicalRecord_(p);
 return [r.responseId,time,r.schemaVersion,r.startedAt,r.completedAt,r.planOrder.join('|'),digest(r),...originalHeaders(p.schemaVersion).slice(7).map(f=>r.flat[f])].map(v=>typeof v==='string'&&/^[=+\-@\t\r]/.test(v)?"'"+v:String(v??''));
}
function harness({unified=true,legacyRows=[]}={}){
 const state={locked:false,writes:[],renames:[],creates:[],failStageWrite:false,failWrite:false,failPromote:false,failFlush:false,corruptStageRead:false,onStageWrite:null,logs:[]},sheets={};
 class Range{
  constructor(sheet,row,col,n=1,width=1){Object.assign(this,{sheet,row,col,n,width});assert.ok(col+width-1<=sheet.maxColumns);}
  getRow(){return this.row;}
  getDisplayValues(){
   const values=Array.from({length:this.n},(_,r)=>Array.from({length:this.width},(_,c)=>this.sheet.data[this.row+r-1]?.[this.col+c-1]??''));
   if(state.corruptStageRead&&this.sheet.name.startsWith('Responses_Union_Staging_')&&values.length>1)values[1][0]='corrupted-readback';
   return values;
  }
  setRichTextValues(values){
   assert.equal(state.locked,true,'all writes must hold the script lock');
   if(state.failWrite||(state.failStageWrite&&this.sheet.name.startsWith('Responses_Union_Staging_')))throw Error('mock write failure');
   assert.equal(values.length,this.n);
   values.forEach((row,r)=>{assert.equal(row.length,this.width);this.sheet.data[this.row+r-1]||=[];row.forEach((v,c)=>this.sheet.data[this.row+r-1][this.col+c-1]=v.text);});
   state.writes.push({sheet:this.sheet.name,row:this.row,count:this.n});
   if(state.onStageWrite&&this.sheet.name.startsWith('Responses_Union_Staging_')){const fn=state.onStageWrite;state.onStageWrite=null;fn();}
  }
  createTextFinder(text){const range=this;return {matchEntireCell(x){assert.equal(x,true);return this;},findNext(){const i=range.getDisplayValues().findIndex(r=>r[0]===text);return i<0?null:new Range(range.sheet,range.row+i,range.col);}};}
 }
 class Sheet{
  constructor(name,columns=26,data=[]){this.name=name;this.maxColumns=columns;this.data=clone(data);}
  getLastRow(){let i=this.data.length;while(i>0&&!this.data[i-1].some(v=>v!==''&&v!=null))i--;return i;}
  getLastColumn(){return Math.max(0,...this.data.map(r=>{let n=r.length;while(n>0&&(r[n-1]===''||r[n-1]==null))n--;return n;}));}
  getMaxColumns(){return this.maxColumns;}
  getRange(...args){return new Range(this,...args);}
  insertColumnsAfter(after,n){assert.equal(state.locked,true);assert.equal(after,this.maxColumns);this.maxColumns+=n;}
  setFrozenRows(n){assert.equal(state.locked,true);this.frozenRows=n;}
  setName(name){
   assert.equal(state.locked,true);if(state.failPromote&&name==='Responses')throw Error('mock promotion failure');
   if(sheets[name])throw Error('duplicate sheet name');
   delete sheets[this.name];state.renames.push([this.name,name]);this.name=name;sheets[name]=this;return this;
  }
 }
 sheets.Responses=new Sheet('Responses',unified?215:203,[unified?headers:originalHeaders('2.2')]);
 sheets.Responses_v2_1=new Sheet('Responses_v2_1',203,[originalHeaders('2.2')]);
 sheets.Responses_v2_2=new Sheet('Responses_v2_2',203,[originalHeaders('2.2'),...legacyRows]);
 const props={SPREADSHEET_ID:'mock_spreadsheet_12345678901234567890',RETURN_URL:'https://example.github.io/survey/'};
 let uuid=0;
 const ctx=vm.createContext({
  console:{log:s=>state.logs.push(s),warn:s=>state.logs.push(s)},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},
  LockService:{getScriptLock:()=>({waitLock(){if(state.locked)throw Error('busy lock');state.locked=true;},releaseLock(){assert.equal(state.locked,true);state.locked=false;}})},
  SpreadsheetApp:{openById(x){assert.equal(x,props.SPREADSHEET_ID);return {getSheetByName:n=>sheets[n]||null,insertSheet(n){assert.equal(state.locked,true);assert.equal(sheets[n],undefined);state.creates.push(n);return sheets[n]=new Sheet(n);}};},flush(){if(state.failFlush)throw Error('mock flush failure');},newRichTextValue:()=>({setText(text){this.text=text;return this;},build(){return {text:this.text};}})},
  Utilities:{getUuid:()=>String(++uuid).padEnd(32,'0'),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(a,s,e)=>[...crypto.createHash(a).update(s,e).digest()]},
  HtmlService:{createHtmlOutput:html=>({html,setTitle(){return this;},addMetaTag(){return this;}})}
 });
 vm.runInContext(source,ctx);
 const submit=p=>{const payload=JSON.stringify(p);return ctx.doPost({contentLength:Buffer.byteLength(new URLSearchParams({payload}).toString()),parameter:{payload},parameters:{payload:[payload]}}).html;};
 const cell=(field,row=1,table='Responses')=>sheets[table].data[row][sheets[table].data[0].indexOf(field)];
 return {ctx,state,sheets,props,submit,cell,Sheet};
}
test('fixed union is 2.3 headers followed by precisely 12 old continuous columns',()=>{
 assert.deepEqual(headers.slice(0,203),originalHeaders('2.3'));assert.equal(headers.length,215);assert.equal(new Set(headers).size,215);
 assert.deepEqual(headers.slice(203),['V_Q23','V_Q23__asked','V_Q24_S','V_Q24_S__asked','V_Q24_B','V_Q24_B__asked','V_Q25_S','V_Q25_S__asked','V_Q25_B','V_Q25_B__asked','V_Q26','V_Q26__asked']);
});
test('both engines retain exact original canonical answers, metadata and digest across routing combinations',()=>{
 const h=harness();
 for(const version of ['2.2','2.3'])for(const s of [1,2,5])for(const b of [1,2,5])for(const exp of [1,2])for(const charge of [1,5]){
  const p=packet(version,{Q16_S:s,Q16_B:b,Q12:exp,Q22:charge,Q27_S:1,Q27_B:4,Q13:[4],Q13__4_text:'source',Q29_B:[3],Q29_B__3_text:'weekly'});
  const actual=h.ctx.canonicalRecord_(p),expected=oracles[version].canonicalRecord_(p);
  assert.deepEqual(clone(actual),clone(expected));assert.equal(digest(actual),digest(expected));
 }
});
test('2.2 continuous values keep old fields and never become bands; 2.3 zero/99 stay version-specific',()=>{
 const h=harness(),p22=packet('2.2'),p23=packet('2.3');
 assert.match(h.submit(p22),/has been saved/);assert.match(h.submit(p23),/has been saved/);
 assert.equal(h.cell('survey_version',1),'2.2');assert.equal(h.cell('V_Q24_S',1),'0.5');assert.equal(h.cell('V_Q23',1),'2.5');
 assert.equal(h.cell('V_Q24_band_S',1),'');assert.equal(h.cell('V_Q24_band_S__asked',1),'0');
 assert.equal(h.cell('survey_version',2),'2.3');assert.equal(h.cell('V_Q24_band_S',2),'0');assert.equal(h.cell('V_Q24_band_S__asked',2),'1');
 assert.equal(h.cell('V_Q23_band',2),'');assert.equal(h.cell('V_Q23_band__asked',2),'1');
 assert.equal(h.cell('V_Q26_band',2),'');assert.equal(h.cell('V_Q26_band__asked',2),'1');assert.equal(h.cell('V_Q24_S__asked',2),'0');
 assert.equal(h.cell('payload_sha256',1),digest(oracles['2.2'].canonicalRecord_(p22)));
});
test('version-specific bounds, school-name limits and campus-budget routing are enforced',()=>{
 const h=harness();
 for(const v of [0,.5,1.25,168])assert.match(h.submit(packet('2.2',{Q24_S:v})),/has been saved/);
 for(const v of [-1,168.01,169,.123])assert.match(h.submit(packet('2.2',{Q24_S:v})),/could not be saved/);
 for(const v of [0,1,2,3,4,5,6,99])assert.match(h.submit(packet('2.3',{Q24_S:v})),/has been saved/);
 for(const v of [.5,1.25,7,168])assert.match(h.submit(packet('2.3',{Q24_S:v})),/could not be saved/);
 assert.match(h.submit(packet('2.2',{Q2:'x'.repeat(41)})),/could not be saved/);
 assert.match(h.submit(packet('2.3',{Q2:'x'.repeat(120)})),/has been saved/);
 assert.match(h.submit(packet('2.3',{Q2:'x'.repeat(121)})),/could not be saved/);
 for(const version of ['2.2','2.3']){
  const p=packet(version,{Q16_S:1,Q16_B:1});delete p.answers.Q26;
  assert.match(h.submit(p),version==='2.2'?/has been saved/:/could not be saved/);
 }
});
test('server clears hidden descendants and ignores client supplied derived fields',()=>{
 const h=harness(),p=packet('2.3',{Q16_S:1,Q16_B:1,Q17_S:[1],Q17_B:[1],Q24_S:999,Q29_S:[3],Q29_S__3_text:'hidden',Q26:99});
 p.flat={V_Q24_S:999,V_Q26_band:99};p.asked={Q26:false};assert.match(h.submit(p),/has been saved/);
 assert.equal(h.cell('V_Q24_band_S'),'');assert.equal(h.cell('V_Q24_band_S__asked'),'0');assert.equal(h.cell('V_Q29_DifferentPlan_txt_S'),'');
 assert.equal(h.cell('V_Q26_band'),'');assert.equal(h.cell('V_Q26_band__asked'),'1');
});
test('unknown and historical versions are rejected, including prototype property names',()=>{
 const h=harness();for(const version of ['2.0','2.1','__proto__','constructor','toString','2.4',2.2,null]){
  const p=packet('2.2');p.schemaVersion=version;assert.match(h.submit(p),/version is no longer accepted/);
 }assert.equal(h.state.writes.length,0);
});
test('setup validates without creating, overwriting, expanding or freezing any table',()=>{
 const h=harness();assert.deepEqual(clone(h.ctx.setupSurveySheet()),{columns:215,mutated:false});assert.equal(h.state.writes.length,0);assert.equal(h.state.creates.length,0);
 h.sheets.Responses.data[0][9]='bad';const before=clone(h.sheets.Responses.data);assert.throws(()=>h.ctx.setupSurveySheet());assert.deepEqual(h.sheets.Responses.data,before);
 delete h.sheets.Responses;assert.throws(()=>h.ctx.setupSurveySheet());assert.equal(h.state.creates.length,0);
});
test('fallback writes only validated 2.2 old destination until union becomes available',()=>{
 const h=harness({unified:false});const p=packet('2.2');assert.match(h.submit(p),/has been saved/);
 assert.equal(h.sheets.Responses.data.length,1);assert.equal(h.sheets.Responses_v2_2.data.length,2);
 assert.match(h.submit(packet('2.3')),/not ready/);assert.equal(h.state.writes.length,1);
 h.sheets.Responses_v2_2.data[0][8]='bad';assert.match(h.submit(packet('2.2')),/could not be saved/);
 assert.equal(h.state.writes.length,1);
});
test('populated or malformed union never silently falls back to legacy',()=>{
 const h=harness();h.sheets.Responses.data[0][8]='bad';assert.match(h.submit(packet('2.2')),/could not be saved/);assert.equal(h.state.writes.length,0);
 const old=harness({unified:false});old.sheets.Responses.data.push(['unexpected']);assert.match(old.submit(packet('2.2')),/could not be saved/);assert.equal(old.state.writes.length,0);
});
test('legacy row projection preserves all 203 original cells and migration source metadata verbatim',()=>{
 const h=harness(),row=oldRow(packet('2.2',{Q33:'=formula text'})),mapped=clone(h.ctx.mapSourceRowToUnion_(originalHeaders('2.2'),row));
 originalHeaders('2.2').forEach((field,i)=>assert.equal(mapped[headers.indexOf(field)],row[i],field));
 assert.equal(mapped.length,215);assert.equal(mapped[headers.indexOf('V_Q24_band_S')],'');assert.equal(mapped[headers.indexOf('V_Q24_band_S__asked')],'0');
 assert.throws(()=>h.ctx.mapSourceRowToUnion_(originalHeaders('2.2').slice().reverse(),row));
});
test('migration holds one lock, readback verifies, preserves source sheets and successfully retries without mutation',()=>{
 const p=packet('2.2'),old=oldRow(p),h=harness({unified:false,legacyRows:[old]}),before=clone(h.sheets.Responses_v2_2.data);
 const outcome=h.ctx.consolidateResponses();assert.equal(outcome.unifiedRows,1);assert.equal(h.state.locked,false);
 assert.deepEqual(h.sheets.Responses_v2_2.data,before);assert.ok(Object.keys(h.sheets).some(n=>n.startsWith('Responses_Empty_ArchivePending_')));
 const cells=clone(h.sheets.Responses.data),writes=h.state.writes.length,creates=h.state.creates.length;
 assert.equal(h.ctx.consolidateResponses().alreadyComplete,true);assert.equal(h.state.writes.length,writes);assert.equal(h.state.creates.length,creates);assert.deepEqual(h.sheets.Responses.data,cells);
 const receipt=h.submit(p);assert.match(receipt,/already received/);assert.ok(receipt.includes(old[1]));assert.equal(h.sheets.Responses.data.length,2);
 assert.match(h.submit(packet('2.3')),/has been saved/);assert.equal(h.sheets.Responses_v2_2.data.length,2);
 assert.equal(h.ctx.consolidateResponses().alreadyComplete,true);assert.equal(h.sheets.Responses.data.length,3);
});
test('migration refuses nonempty 2.0/2.1 or invalid 2.2 source without mutating sources',()=>{
 for(const target of ['Responses','Responses_v2_1']){
  const h=harness({unified:false});h.sheets[target].data.push(['DO NOT LOSE']);
  const before=clone(h.sheets[target].data);assert.throws(()=>h.ctx.consolidateResponses());assert.deepEqual(h.sheets[target].data,before);assert.equal(h.state.creates.length,0);assert.equal(h.state.locked,false);
 }
 const h=harness({unified:false,legacyRows:[oldRow(packet('2.2'))]});h.sheets.Responses_v2_2.data[1][2]='2.1';
 assert.throws(()=>h.ctx.consolidateResponses());assert.equal(h.state.creates.length,0);
});
test('staging write/readback failure leaves original data intact and retry can recover',()=>{
 for(const flag of ['failStageWrite','corruptStageRead','failFlush']){
  const h=harness({unified:false,legacyRows:[oldRow(packet('2.2'))]}),before=clone(h.sheets.Responses_v2_2.data);
  h.state[flag]=true;assert.throws(()=>h.ctx.consolidateResponses());assert.deepEqual(h.sheets.Responses_v2_2.data,before);assert.equal(h.state.locked,false);
  h.state[flag]=false;assert.equal(h.ctx.consolidateResponses().unifiedRows,1);assert.deepEqual(h.sheets.Responses_v2_2.data,before);
 }
});
test('rename failure keeps source, 2.2 fallback can accept another response, and retry migrates both',()=>{
 const h=harness({unified:false,legacyRows:[oldRow(packet('2.2'))]});h.state.failPromote=true;
 assert.throws(()=>h.ctx.consolidateResponses());assert.equal(h.sheets.Responses,undefined);assert.equal(h.sheets.Responses_v2_2.data.length,2);
 assert.match(h.submit(packet('2.3')),/not ready/);assert.match(h.submit(packet('2.2')),/has been saved/);
 h.state.failPromote=false;assert.equal(h.ctx.consolidateResponses().unifiedRows,2);assert.equal(h.sheets.Responses.data.length,3);assert.equal(h.sheets.Responses_v2_2.data.length,3);
});
test('concurrent submit cannot bypass migration lock; successful retry writes to unified table',()=>{
 const h=harness({unified:false,legacyRows:[oldRow(packet('2.2'))]}),pending=packet('2.2');
 h.state.onStageWrite=()=>assert.match(h.submit(pending),/could not be saved/);
 h.ctx.consolidateResponses();assert.match(h.submit(pending),/has been saved/);assert.equal(h.sheets.Responses.data.length,3);assert.equal(h.sheets.Responses_v2_2.data.length,2);
});
test('external source edit during staging is detected before promotion',()=>{
 const h=harness({unified:false,legacyRows:[oldRow(packet('2.2'))]});
 h.state.onStageWrite=()=>h.sheets.Responses_v2_2.data.push(oldRow(packet('2.2')));
 assert.throws(()=>h.ctx.consolidateResponses(),/changed during migration/);assert.equal(h.sheets.Responses.data.length,1);assert.equal(h.sheets.Responses_v2_2.data.length,3);
 assert.equal(h.ctx.consolidateResponses().unifiedRows,2);
});
test('duplicate IDs, conflict digests, and incomplete existing union prevent unsafe migration',()=>{
 const p=packet('2.2'),row=oldRow(p),h=harness({unified:false,legacyRows:[row,row]});assert.throws(()=>h.ctx.consolidateResponses());assert.equal(h.state.creates.length,0);
 const partial=harness({legacyRows:[row]});assert.throws(()=>partial.ctx.consolidateResponses(),/does not exactly contain/);assert.equal(partial.state.writes.length,0);
});
test('same ID same digest is idempotent; changed answers or changed version cannot overwrite',()=>{
 const h=harness(),p=packet('2.2');assert.match(h.submit(p),/has been saved/);const saved=clone(h.sheets.Responses.data);
 assert.match(h.submit(p),/already received/);assert.deepEqual(h.sheets.Responses.data,saved);
 p.answers.Q24_S=1.25;assert.match(h.submit(p),/different answers/);assert.deepEqual(h.sheets.Responses.data,saved);
 const v23=packet('2.3');v23.responseId=p.responseId;assert.match(h.submit(v23),/different answers/);assert.deepEqual(h.sheets.Responses.data,saved);
});
test('write and flush failures never fake success and retry is safe',()=>{
 const h=harness(),p=packet('2.3');h.state.failWrite=true;assert.match(h.submit(p),/could not be saved/);assert.equal(h.sheets.Responses.data.length,1);assert.equal(h.state.locked,false);
 h.state.failWrite=false;h.state.failFlush=true;assert.match(h.submit(p),/could not be saved/);assert.equal(h.sheets.Responses.data.length,2);
 h.state.failFlush=false;assert.match(h.submit(p),/already received/);assert.equal(h.sheets.Responses.data.length,2);
});
test('formula safety, no answer disclosure, malformed payload rejection and return-link trust remain intact',()=>{
 const h=harness(),p=packet('2.3',{Q33:'=IMPORTDATA("private")'});
 assert.match(h.submit(p),/has been saved/);assert.equal(h.cell('V_Q33'),"'=IMPORTDATA(\"private\")");
 const get=h.ctx.doGet().html;assert.ok(!get.includes('IMPORTDATA'));assert.ok(!get.includes(h.props.SPREADSHEET_ID));
 for(const version of ['2.2','2.3'])for(const patch of [{Q1:0},{UNAUTHORIZED:'x'},{Q2:{}},{Q24_S:[1]},{Q20_S:''}])assert.match(h.submit(packet(version,patch)),/could not be saved/);
 const attacker=packet('2.3');attacker.returnUrl='https://attacker.invalid';const html=h.submit(attacker);assert.match(html,/unsupported fields/);assert.ok(!html.includes('attacker.invalid'));assert.ok(!h.state.logs.some(s=>s.includes('IMPORTDATA')));
});


test('release collector is byte-identical to the deployed frozen source and has no colliding .gs files',()=>{
 assert.equal(sha(source),'30a0e13823afdee8c51fa1b87820f524b945318578778e2e959d0ec4baa7f716');
 assert.deepEqual(fs.readdirSync(root).filter(name=>name.endsWith('.gs')),['UnifiedCollector.gs']);
});
