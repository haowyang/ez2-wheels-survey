import {verifyImportedRecord, recordsToCsv} from './logic.mjs?v=2.4';
const schema=await fetch('./survey.json?v=2.4').then(r=>{if(!r.ok)throw new Error('Survey schema could not load.');return r.json();});
const records=new Map();
const status=document.querySelector('#import-status');
function refresh(){
  const container=document.querySelector('#responses');container.replaceChildren();
  if(!records.size){const p=document.createElement('p');p.className='muted';p.textContent='No responses imported.';container.append(p);}
  for(const record of records.values()){const row=document.createElement('div');row.className='response-row';const title=document.createElement('strong');title.textContent=record.responseId;const details=document.createElement('span');details.textContent=`Completed ${new Date(record.completedAt).toLocaleString()} · version ${record.schemaVersion}`;row.append(title,details);container.append(row);}
  document.querySelector('#export').disabled=records.size===0;
}
document.querySelector('#files').addEventListener('change',async event=>{
  const notes=[];let added=0,duplicates=0;
  for(const file of event.target.files){
    try{
      if(file.size>256000)throw new Error('File is larger than the 250 KB limit.');
      const record=verifyImportedRecord(schema,JSON.parse(await file.text()));
      const old=records.get(record.responseId);
      if(old){
        if(JSON.stringify(old.answers)===JSON.stringify(record.answers)){duplicates++;continue;}
        throw new Error('Conflicting answers for an existing response ID. The first file was retained; review the two files manually.');
      }
      records.set(record.responseId,record);added++;
    }catch(error){notes.push(`${file.name}: ${error.message}`);}
  }
  status.replaceChildren();const summary=document.createElement('p');summary.textContent=`${added} added; ${duplicates} identical duplicates ignored; ${notes.length} rejected. ${records.size} total responses ready.`;status.append(summary);
  if(notes.length){const list=document.createElement('ul');list.className='errors';for(const note of notes){const item=document.createElement('li');item.textContent=note;list.append(item);}status.append(list);}
  refresh();event.target.value='';
});
document.querySelector('#export').onclick=()=>{
  const blob=new Blob([recordsToCsv([...records.values()])],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`ez2-combined-${new Date().toISOString().slice(0,10)}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
document.querySelector('#clear').onclick=()=>{records.clear();status.textContent='Imported files cleared from this page.';refresh();};
