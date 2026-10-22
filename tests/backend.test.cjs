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
const currentSchema=JSON.parse(fs.readFileSync(path.join(site,'survey.json'),'utf8'));
const frontend=fs.readFileSync(path.join(site,'logic.mjs'),'utf8').replace(/^export /gm,'');
oracles['2.4']=vm.createContext({});vm.runInContext('const SURVEY_SCHEMA='+JSON.stringify(currentSchema)+';\n'+frontend,oracles['2.4']);
const schemaFor=v=>JSON.parse(vm.runInContext('JSON.stringify(SURVEY_SCHEMA)',oracles[v]));
const expectedRecord=p=>p.schemaVersion==='2.4'?oracles['2.4'].makeRecord(currentSchema,p.answers,{...p,planOrder:p.planOrder.map(String)}):oracles[p.schemaVersion].canonicalRecord_(p);
let counter=100;
function packet(version,overrides={}){
 const p=JSON.parse(fs.readFileSync(path.join(root,'testing/qa/packet-'+version+'.json'),'utf8'));
 p.responseId='aaaaaaaa-aaaa-4aaa-8aaa-'+String(++counter).padStart(12,'0');Object.assign(p.answers,overrides);
 for(let pass=0;pass<4;pass++)for(const {q,key} of oracles[version].expandedQuestions(schemaFor(version),p.answers)){
  if(p.answers[key]!==undefined)continue;
  const type=q.type.replace('product_','');p.answers[key]=type==='text'?'SYNTHETIC':type==='multi'?[q.options[0].value]:type==='single'?q.options[0].value:q.min||0;
 }
 return p;
}
function digest(r){return sha(JSON.stringify({version:r.schemaVersion,answers:r.answers,planOrder:r.planOrder}));}
function rowFor(p,width=215){
 const r=expectedRecord(p),fields={submission_id:r.responseId,received_at_utc:'2026-10-22T17:00:00.000Z',survey_version:r.schemaVersion,started_at_utc:r.startedAt,completed_at_utc:r.completedAt,plan_order:r.planOrder.join('|'),payload_sha256:digest(r),...r.flat};
 return (width===215?previousHeaders:headers).map(f=>{
  const value=Object.hasOwn(fields,f)?fields[f]:f.endsWith('__asked')?0:'';
  return typeof value==='string'&&/^[=+\-@\t\r]/.test(value)?"'"+value:String(value??'');
 });
}
function harness({upgraded=true,rows=[],columns}={}){
 const state={locked:false,writes:[],expansions:[],flushes:0,failWrite:false,failHeaderWrite:false,partialHeaderFailure:false,failExpand:false,failFlushAt:0,corruptExtraRead:false,onExtraWrite:null,throwAfterExtraWrite:false,logs:[]};
 const sheets={};
 class Range{
  constructor(sheet,row,col,n=1,width=1){Object.assign(this,{sheet,row,col,n,width});assert.ok(row>=1&&col>=1&&n>=1&&col+width-1<=sheet.maxColumns);}
  getRow(){return this.row;}
  getDisplayValues(){
   const values=Array.from({length:this.n},(_,r)=>Array.from({length:this.width},(_,c)=>this.sheet.data[this.row+r-1]?.[this.col+c-1]??''));
   if(state.corruptExtraRead&&this.row>1&&this.col===216&&state.writes.some(w=>w.column===216&&w.row>1))values[0][0]='bad read';
   return values;
  }
  setRichTextValues(values){
   assert.equal(state.locked,true,'writes must hold the script lock');assert.equal(values.length,this.n);
   if(state.failWrite||(state.failHeaderWrite&&this.row===1))throw Error('mock write failure');
   const partial=state.partialHeaderFailure&&this.row===1;
   values.forEach((row,r)=>{assert.equal(row.length,this.width);this.sheet.data[this.row+r-1]||=[];row.forEach((v,c)=>{if(!partial||c===0)this.sheet.data[this.row+r-1][this.col+c-1]=v.text;});});
   state.writes.push({row:this.row,column:this.col,count:this.n,width:this.width});
   if(this.row>1&&this.col===216&&state.onExtraWrite){const callback=state.onExtraWrite;state.onExtraWrite=null;callback();}
   if(partial||(this.row>1&&this.col===216&&state.throwAfterExtraWrite))throw Error('mock applied-write failure');
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
 sheets.Responses=new Sheet([upgraded?headers:previousHeaders,...rows],columns??(upgraded?217:215));
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
const original215=h=>h.sheets.Responses.getRange(1,1,h.sheets.Responses.getLastRow(),215).getDisplayValues();

test('217 headers preserve the complete frozen 215-column prefix and append only Q8 none',()=>{
 assert.equal(headers.length,217);assert.equal(new Set(headers).size,217);assert.deepEqual(headers.slice(0,215),previousHeaders);assert.deepEqual(headers.slice(215),['V_Q8_9','V_Q8_9__asked']);
 assert.deepEqual(previousHeaders.slice(0,203),clone(oracles['2.3'].backendHeaders_()));
 assert.deepEqual(previousHeaders.slice(203),['V_Q23','V_Q24_S','V_Q24_B','V_Q25_S','V_Q25_B','V_Q26'].flatMap(f=>[f,f+'__asked']));
 assert.equal(harness().ctx.sourceHeaders_('2.4').length,205);
});
test('all embedded 2.2/2.3 schema and logic source remains unchanged from its frozen oracle',()=>{
 const normalize=s=>s.replace(/\r\n/g,'\n').trim();
 for(const version of ['2.2','2.3']){
  const embedded=source.split('"'+version+'":(function(){')[1].split('return Object.freeze({schema:SURVEY_SCHEMA')[0];
  const oracle=oracleSources[version].slice(0,oracleSources[version].indexOf('/* Google Sheets receiver'));
  assert.equal(normalize(embedded),normalize(oracle));
 }
});
test('all three engines retain exact canonical values and digest across 216 routing combinations',()=>{
 const h=harness();
 for(const version of ['2.2','2.3','2.4'])for(const S of [1,2,5])for(const B of [1,2,5])for(const experience of [1,2])for(const charge of [1,5]){
  const p=packet(version,{Q16_S:S,Q16_B:B,Q12:experience,Q22:charge,Q27_S:1,Q27_B:4,Q13:[4],Q13__4_text:'source',Q29_B:[3],Q29_B__3_text:'weekly'});
  const actual=h.ctx.canonicalRecord_(p),expected=expectedRecord(p);
  assert.deepEqual(clone(actual),clone(expected));assert.equal(digest(actual),digest(expected));
 }
});
test('legacy continuous values and new bands stay distinct; absent new Q8 remains blank/asked0',()=>{
 const h=harness();for(const v of ['2.2','2.3','2.4'])assert.match(h.submit(packet(v)),/has been saved/);
 assert.equal(h.cell('V_Q24_S',1),'0.5');assert.equal(h.cell('V_Q23',1),'2.5');assert.equal(h.cell('V_Q24_band_S',1),'');assert.equal(h.cell('V_Q24_band_S__asked',1),'0');
 assert.equal(h.cell('V_Q24_band_S',2),'0');assert.equal(h.cell('V_Q24_band_S__asked',2),'1');assert.equal(h.cell('V_Q23_band',2),'');assert.equal(h.cell('V_Q23_band__asked',2),'1');
 for(const row of [1,2]){assert.equal(h.cell('V_Q8_9',row),'');assert.equal(h.cell('V_Q8_9__asked',row),'0');}
 assert.equal(h.cell('V_Q8_9',3),'1');assert.equal(h.cell('V_Q8_9__asked',3),'1');
});
test('Q8 none is exclusive through the endpoint handler; it is not silently cleaned into a valid answer',()=>{
 const h=harness();for(const values of [[9,1],['9',1],[9,'8'],[9,1,2]]){
  assert.match(h.submit(packet('2.4',{Q8:values,Q8__8_text:'Other transport'})),/could not be saved/);
 }
 assert.equal(h.state.writes.length,0);
 for(const v of [9,'9'])assert.match(h.submit(packet('2.4',{Q8:[v]})),/has been saved/);
 for(const row of [1,2]){assert.equal(h.cell('V_Q8_9',row),'1');assert.equal(h.cell('V_Q8_1',row),'0');assert.equal(h.cell('V_Q8_Other_txt',row),'');}
 assert.match(h.submit(packet('2.4',{Q8:[1,2]})),/has been saved/);assert.equal(h.cell('V_Q8_9',3),'0');assert.equal(h.cell('V_Q8_9__asked',3),'1');
 for(const v of ['2.2','2.3'])assert.match(h.submit(packet(v,{Q8:[9]})),/could not be saved/);
});
test('Q14 unknown is missing only in 2.4 and remains distinct from Never experience',()=>{
 const h=harness();for(const v of ['2.2','2.3'])assert.match(h.submit(packet(v,{Q14:99})),/could not be saved/);
 assert.match(h.submit(packet('2.4',{Q12:2,Q14:99})),/has been saved/);assert.equal(h.cell('V_Q14'),'');assert.equal(h.cell('V_Q14__asked'),'1');
 assert.match(h.submit(packet('2.4',{Q12:1,Q14:99})),/has been saved/);assert.equal(h.cell('V_Q14',2),'');assert.equal(h.cell('V_Q14__asked',2),'0');
 assert.match(h.submit(packet('2.4',{Q12:2,Q14:1})),/has been saved/);assert.equal(h.cell('V_Q14',3),'1');assert.equal(h.cell('V_Q14__asked',3),'1');
});
test('version-specific numeric/category bounds, school limits, and budget routing remain enforced',()=>{
 const h=harness();for(const value of [0,.5,1.25,168])assert.match(h.submit(packet('2.2',{Q24_S:value})),/has been saved/);
 for(const value of [-1,.123,168.01,169])assert.match(h.submit(packet('2.2',{Q24_S:value})),/could not be saved/);
 for(const version of ['2.3','2.4']){
  for(const value of [0,1,2,3,4,5,6,99])assert.match(h.submit(packet(version,{Q24_S:value})),/has been saved/);
  for(const value of [.5,1.25,7,168])assert.match(h.submit(packet(version,{Q24_S:value})),/could not be saved/);
  assert.match(h.submit(packet(version,{Q2:'x'.repeat(120)})),/has been saved/);assert.match(h.submit(packet(version,{Q2:'x'.repeat(121)})),/could not be saved/);
  const p=packet(version,{Q16_S:1,Q16_B:1});delete p.answers.Q26;assert.match(h.submit(p),/could not be saved/);
 }
 assert.match(h.submit(packet('2.2',{Q2:'x'.repeat(41)})),/could not be saved/);
});
test('server clears hidden answers and ignores client supplied flat/asked values',()=>{
 const h=harness(),p=packet('2.4',{Q16_S:1,Q16_B:1,Q17_S:[1],Q17_B:[1],Q24_S:999,Q29_S:[3],Q29_S__3_text:'hidden',Q26:99});
 p.flat={V_Q8_9:777,V_Q26_band:99};p.asked={Q26:false};assert.match(h.submit(p),/has been saved/);
 assert.equal(h.cell('V_Q24_band_S'),'');assert.equal(h.cell('V_Q24_band_S__asked'),'0');assert.equal(h.cell('V_Q29_DifferentPlan_txt_S'),'');assert.equal(h.cell('V_Q26_band'),'');assert.equal(h.cell('V_Q26_band__asked'),'1');assert.equal(h.cell('V_Q8_9'),'1');
});
test('historical or malformed versions are rejected without writes',()=>{
 const h=harness();for(const version of ['2.0','2.1','2.5','__proto__','constructor','toString',2.4,null]){
  const p=packet('2.4');p.schemaVersion=version;assert.match(h.submit(p),/version is no longer accepted/);
 }assert.equal(h.state.writes.length,0);
});
test('setup validates only exact 217 headers and never writes or creates a table',()=>{
 const h=harness();assert.deepEqual(clone(h.ctx.setupSurveySheet()),{columns:217,mutated:false});assert.equal(h.state.writes.length,0);
 const old=harness({upgraded:false});assert.throws(()=>old.ctx.setupSurveySheet());assert.equal(old.state.writes.length,0);
 delete h.sheets.Responses;assert.throws(()=>h.ctx.setupSurveySheet());assert.equal(h.state.writes.length,0);
 assert.doesNotMatch(source,/\.insertSheet\(|\.deleteSheet\(|\.setName\(/);assert.equal(h.ctx.consolidateResponses,undefined);
});
test('before upgrade both previous versions write exactly 215 columns and 2.4 is refused',()=>{
 const h=harness({upgraded:false});for(const v of ['2.2','2.3'])assert.match(h.submit(packet(v)),/has been saved/);
 assert.equal(h.state.writes.length,2);assert.ok(h.state.writes.every(w=>w.width===215));assert.match(h.submit(packet('2.4')),/not ready/);assert.equal(h.state.writes.length,2);
});
test('malformed or missing unified headers never divert submissions into any other table',()=>{
 for(const alteration of [h=>h.sheets.Responses.data[0][0]='wrong',h=>h.sheets.Responses.data[0][215]='unknown',h=>{h.sheets.Responses.maxColumns=218;h.sheets.Responses.data[0][217]='unexpected';},h=>delete h.sheets.Responses]){
  const h=harness();alteration(h);for(const v of ['2.2','2.3','2.4'])assert.match(h.submit(packet(v)),/could not be saved/);assert.equal(h.state.writes.length,0);
 }
});
test('append-only upgrade preserves every old cell including digest/formula text and blank row gaps',()=>{
 const rows=[rowFor(packet('2.2',{Q33:'=formula text'})),[],rowFor(packet('2.3'))],h=harness({upgraded:false,rows}),before=original215(h);
 const result=h.ctx.upgradeUnifiedHeaders();assert.equal(result.historicalRows,2);assert.equal(result.priorColumnsUnchanged,true);assert.equal(h.state.locked,false);
 assert.deepEqual(original215(h),before);assert.deepEqual(h.sheets.Responses.data[0],headers);assert.equal(h.cell('V_Q8_9__asked',1),'0');assert.equal(h.cell('V_Q8_9__asked',2),'');assert.equal(h.cell('V_Q8_9__asked',3),'0');
 assert.ok(h.state.writes.every(w=>w.column===216&&w.width===2));assert.deepEqual(h.state.expansions,[{after:215,count:2}]);
 assert.match(h.submit(packet('2.4')),/has been saved/);
});
test('empty table upgrades only the two headers and does not invent response rows',()=>{
 const h=harness({upgraded:false}),before=original215(h);h.ctx.upgradeUnifiedHeaders();assert.deepEqual(original215(h),before);assert.equal(h.sheets.Responses.getLastRow(),1);assert.deepEqual(h.state.writes,[{row:1,column:216,count:1,width:2}]);
});
test('existing spare columns are reused without adding columns or changing any old cells',()=>{
 const h=harness({upgraded:false,rows:[rowFor(packet('2.3'))],columns:230}),before=original215(h);h.ctx.upgradeUnifiedHeaders();assert.deepEqual(original215(h),before);assert.equal(h.state.expansions.length,0);
});
test('completed upgrade retries are read-only, including after new 2.4 rows arrive',()=>{
 const h=harness({upgraded:false,rows:[rowFor(packet('2.2')),rowFor(packet('2.3'))]});h.ctx.upgradeUnifiedHeaders();h.submit(packet('2.4'));
 const before=clone(h.sheets.Responses.data),writes=h.state.writes.length;assert.equal(h.ctx.upgradeUnifiedHeaders().alreadyComplete,true);assert.deepEqual(h.sheets.Responses.data,before);assert.equal(h.state.writes.length,writes);
});
test('duplicate old receipt survives upgrade without changing original timestamp or digest',()=>{
 const p=packet('2.3'),row=rowFor(p),h=harness({upgraded:false,rows:[row]});h.ctx.upgradeUnifiedHeaders();const before=clone(h.sheets.Responses.data);
 const html=h.submit(p);assert.match(html,/already received/);assert.ok(html.includes(row[1]));assert.deepEqual(h.sheets.Responses.data,before);
});
test('expansion, data-write, and readback failures preserve old cells and safely retry',()=>{
 for(const flag of ['failExpand','failWrite','throwAfterExtraWrite','corruptExtraRead']){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.2'))]}),before=original215(h);h.state[flag]=true;assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.deepEqual(original215(h),before);assert.equal(h.state.locked,false);
  h.state[flag]=false;assert.match(h.submit(packet('2.4')),/not ready/);assert.equal(h.ctx.upgradeUnifiedHeaders().columns,217);assert.deepEqual(original215(h),before);
 }
});
test('a failed or partial final header write lets old submissions continue, then retry includes them',()=>{
 for(const flag of ['failHeaderWrite','partialHeaderFailure']){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.2'))]});h.state[flag]=true;assert.throws(()=>h.ctx.upgradeUnifiedHeaders());h.state[flag]=false;
  assert.match(h.submit(packet('2.4')),/not ready/);assert.match(h.submit(packet('2.3')),/has been saved/);const before=original215(h);
  h.ctx.upgradeUnifiedHeaders();assert.deepEqual(original215(h),before);assert.equal(h.cell('V_Q8_9__asked',2),'0');
 }
});
test('flush failure before or after header commit retries without modifying old cells',()=>{
 for(const flush of [1,2]){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.3'))]}),before=original215(h);h.state.failFlushAt=flush;assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.deepEqual(original215(h),before);
  h.state.failFlushAt=0;const result=h.ctx.upgradeUnifiedHeaders();assert.equal(result.alreadyComplete,flush===2);assert.deepEqual(original215(h),before);
 }
});
test('multiple batches initialize only new columns and a retry keeps all 501 prior rows',()=>{
 const rows=Array.from({length:501},()=>rowFor(packet('2.3'))),h=harness({upgraded:false,rows}),before=original215(h);h.ctx.upgradeUnifiedHeaders();
 assert.deepEqual(original215(h),before);assert.deepEqual(h.state.writes.filter(w=>w.row>1).map(w=>w.count),[250,250,1]);
 for(let i=1;i<=501;i++){assert.equal(h.cell('V_Q8_9',i),'');assert.equal(h.cell('V_Q8_9__asked',i),'0');}
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
  assert.notDeepEqual(h.sheets.Responses.data[0],headers);assert.match(h.submit(packet('2.4')),/not ready/);const updated=original215(h);h.ctx.upgradeUnifiedHeaders();assert.deepEqual(original215(h),updated);
 }
});
test('unknown new-column contents or unexpected historical version are never overwritten',()=>{
 for(const alter of [h=>{h.sheets.Responses.data[1][215]='1';},h=>{h.sheets.Responses.data[1][216]='1';},h=>{h.sheets.Responses.data[1][2]='2.4';},h=>{h.sheets.Responses.data[0][215]='incorrect';}]){
  const h=harness({upgraded:false,rows:[rowFor(packet('2.3'))],columns:217});alter(h);const before=clone(h.sheets.Responses.data);assert.throws(()=>h.ctx.upgradeUnifiedHeaders());assert.deepEqual(clone(h.sheets.Responses.data),before);assert.equal(h.state.writes.length,0);
 }
});
test('same ID same digest is idempotent while changed answers or changed version cannot overwrite',()=>{
 const h=harness(),p=packet('2.4');assert.match(h.submit(p),/has been saved/);const before=clone(h.sheets.Responses.data);assert.match(h.submit(p),/already received/);assert.deepEqual(h.sheets.Responses.data,before);
 p.answers.Q8=[1];assert.match(h.submit(p),/different answers/);assert.deepEqual(h.sheets.Responses.data,before);
 const old=packet('2.3');old.responseId=p.responseId;assert.match(h.submit(old),/different answers/);assert.deepEqual(h.sheets.Responses.data,before);
});
test('submission write/flush failures never fake success and retries are safe',()=>{
 const h=harness(),p=packet('2.4');h.state.failWrite=true;assert.match(h.submit(p),/could not be saved/);assert.equal(h.sheets.Responses.getLastRow(),1);assert.equal(h.state.locked,false);
 h.state.failWrite=false;h.state.failFlushAt=1;assert.match(h.submit(p),/could not be saved/);assert.equal(h.sheets.Responses.getLastRow(),2);h.state.failFlushAt=0;assert.match(h.submit(p),/already received/);assert.equal(h.sheets.Responses.getLastRow(),2);
});
test('formula safety, privacy, malformed payload rejection, and trusted return links remain intact',()=>{
 const h=harness(),p=packet('2.4',{Q33:'=IMPORTDATA("private")'});assert.match(h.submit(p),/has been saved/);assert.equal(h.cell('V_Q33'),"'=IMPORTDATA(\"private\")");
 const get=h.ctx.doGet().html;assert.ok(!get.includes('IMPORTDATA'));assert.ok(!get.includes(h.props.SPREADSHEET_ID));
 for(const version of ['2.2','2.3','2.4'])for(const patch of [{Q1:0},{UNAUTHORIZED:'x'},{Q2:{}},{Q24_S:[1]},{Q20_S:''}])assert.match(h.submit(packet(version,patch)),/could not be saved/);
 const attacker=packet('2.4');attacker.returnUrl='https://attacker.invalid';const html=h.submit(attacker);assert.match(html,/unsupported fields/);assert.ok(!html.includes('attacker.invalid'));assert.ok(!h.state.logs.some(s=>s.includes('IMPORTDATA')));
});
test('the release has exactly one deployable Apps Script source file',()=>{
 assert.deepEqual(fs.readdirSync(root).filter(name=>name.endsWith('.gs')),['UnifiedCollector.gs']);
});
