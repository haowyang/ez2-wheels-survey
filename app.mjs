import {questionsForSection, pricingOptionsHtml, SCREEN_OUT_TEXT} from './presentation.mjs?v=3.3';
import {productIntroHtml} from './product-intro.mjs?v=3.3';
import {PRODUCT_NAMES, allQuestions, keyFor, otherKey, isVisible, visibleProducts, cleanAnswers, validateItem, validateAll, updateMultiSelection, shuffledPlans, orderedOptions, makeRecord, recordsToCsv} from './logic.mjs?v=3.3';

const app=document.querySelector('#app');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same=(a,b)=>String(a)===String(b);
let schema, config, state, errors=[], storageAvailable=true;
const storageKey='ez2-survey-v2';

function freshState(){return {version:schema.version,responseId:crypto.randomUUID(),startedAt:new Date().toISOString(),completedAt:null,planOrder:shuffledPlans(),answers:{},sectionId:schema.sections[0].id,review:false};}
function save(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{storageAvailable=false;}}
function shownSections(){return schema.sections.filter(section=>section.questions.some(q=>isVisible(q,state.answers)));}
function shownQuestions(section){return questionsForSection(section,state.answers);}
function errorHtml(key){const error=errors.find(e=>e.key===key);return error?`<p class="field-error" id="err-${esc(key)}">${esc(error.message)}</p>`:'';}
function selected(value, option){return Array.isArray(value)?value.some(v=>same(v,option)):same(value,option);}
function inputHtml(q,key,product=null){
  const value=state.answers[key],type=q.type.replace('product_','');
  const invalid=errors.some(e=>e.key===key)?' aria-invalid="true"':'';
  if(q.id==='Q26')return pricingOptionsHtml(schema,q,product,key,value,state.planOrder)+errorHtml(key);
  if(type==='number')return `<input id="${esc(key)}" class="text-input number-input" type="number" inputmode="${q.decimals===0?'numeric':'decimal'}" data-key="${esc(key)}" data-kind="number" value="${esc(value)}" ${q.min!==undefined?`min="${q.min}"`:''} ${q.max!==undefined?`max="${q.max}"`:''} step="${q.decimals!==undefined?10**-q.decimals:'any'}" aria-label="${esc(q.text)}"${invalid}>${errorHtml(key)}`;
  if(type==='text')return `<${q.id==='Q33'?'textarea':'input'} id="${esc(key)}" class="text-input" ${q.id==='Q33'?'rows="3"':'type="text"'} data-key="${esc(key)}" data-kind="text" ${q.maxLength?`maxlength="${q.maxLength}"`:''} aria-label="${esc(q.text)}"${invalid}${q.id==='Q33'?`>${esc(value)}</textarea>`:` value="${esc(value)}">`}${q.maxLength?`<p class="hint">Up to ${q.maxLength} characters.</p>`:''}${errorHtml(key)}`;
  if(type==='scale'){
    const options=q.options?.length?q.options:Array.from({length:q.max-q.min+1},(_,i)=>({value:q.min+i,label:String(q.min+i)}));
    return `<div class="scale" style="--scale-count:${options.length};${options.length<=6?`grid-template-columns:repeat(${options.length},minmax(0,1fr))`:''}" role="radiogroup" aria-label="${esc(q.text)}">${options.map(o=>`<label title="${esc(o.label)}"><input type="radio" name="${esc(key)}" data-key="${esc(key)}" data-kind="scale" value="${o.value}" ${selected(value,o.value)?'checked':''} aria-label="${esc(o.label)}"><span aria-hidden="true">${o.value}</span></label>`).join('')}</div><div class="scale-labels"><span>${esc(options[0].label)}</span><span>${esc(options.at(-1).label)}</span></div>${errorHtml(key)}`;
  }
  return `<div class="options">${orderedOptions(q,state.planOrder).map(o=>{
    const chosen=selected(value,o.value), detailKey=otherKey(key,o);
    return `<div><label class="option"><input type="${type==='multi'?'checkbox':'radio'}" name="${esc(key)}" data-key="${esc(key)}" data-kind="${type}" value="${esc(o.value)}" ${chosen?'checked':''}><span class="option-body"><span class="option-title">${esc(o.label)}</span></span></label>${o.other&&chosen?`<div class="other-input"><label for="${esc(detailKey)}">${esc(o.otherPrompt||'Please specify.')}${o.otherRequired?' *':''}</label><input id="${esc(detailKey)}" class="text-input" data-key="${esc(detailKey)}" data-kind="text" type="text" value="${esc(state.answers[detailKey])}" maxlength="${o.otherMaxLength||100}">${errorHtml(detailKey)}</div>`:''}</div>`;
  }).join('')}</div>${errorHtml(key)}`;
}
function questionHtml(q){return `<fieldset class="question" id="question-${q.id}"><legend><span class="q-number">${esc(q.id)}</span>${esc(q.text)}${q.required?'<span class="required" aria-label="required">*</span>':''}</legend>${q.help?`<p class="hint">${esc(q.help)}</p>`:''}${q.type.startsWith('product_')?visibleProducts(q,state.answers).map(p=>`<div class="product-block" role="group" aria-labelledby="label-${q.id}-${p}"><div class="product-title" id="label-${q.id}-${p}">${PRODUCT_NAMES[p]}</div>${inputHtml(q,keyFor(q,p),p)}</div>`).join(''):inputHtml(q,q.id)}</fieldset>`;}
function startOver(){if(confirm('Clear your answers in this tab and start again?')){state=freshState();errors=[];save();render(true);}}
function move(direction){const sections=shownSections(),index=sections.findIndex(s=>s.id===state.sectionId);state.sectionId=sections[Math.max(0,Math.min(sections.length-1,index+direction))].id;state.review=false;errors=[];save();render(true);}
function next(){
  const sections=shownSections(),section=sections.find(s=>s.id===state.sectionId)||sections[0];
  errors=shownQuestions(section).flatMap(q=>q.type.startsWith('product_')?visibleProducts(q,state.answers).flatMap(p=>validateItem(q,keyFor(q,p),state.answers)):validateItem(q,q.id,state.answers));
  if(errors.length){render();app.querySelector('.notice.error')?.focus();return;}
  if(same(state.answers.Q1,0)){render(true);return;}
  if(section.id===sections.at(-1).id){
    errors=validateAll(schema,state.answers);
    if(errors.length){const first=errors[0].key.split('_')[0];state.sectionId=schema.sections.find(s=>s.questions.some(q=>q.id===first)).id;render(true);return;}
    state.review=true;state.completedAt=new Date().toISOString();save();render(true);
  }else move(1);
}
function record(){return makeRecord(schema,state.answers,state);}
function download(text,name,mime){const url=URL.createObjectURL(new Blob([text],{type:mime}));const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function downloadRecord(kind){const data=record(),stem=`ez2-response-${state.responseId}`;download(kind==='json'?JSON.stringify(data,null,2):recordsToCsv([data]),`${stem}.${kind}`,kind==='json'?'application/json':'text/csv;charset=utf-8');document.querySelector('#download-status').textContent='Backup downloaded. Downloading does not submit your response.';}
function validEndpoint(){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.submissionEndpoint||'');}
function submit(){
  if(!validEndpoint())return;
  const data=record();save();
  // A normal form POST allows Apps Script to display its genuine server confirmation.
  // There is no opaque no-cors response and no simulated success message here.
  const form=document.createElement('form');form.method='POST';form.action=config.submissionEndpoint;form.target='_self';
  const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(data);form.append(input);document.body.append(form);
  document.querySelector('#submit-response').disabled=true;document.querySelector('#submit-status').textContent='Opening the secure submission page. Your response is submitted only when that page confirms it was saved.';
  form.submit();
}
function render(scroll=false){
  if(same(state.answers.Q1,0)){
    app.innerHTML=`<div class="hero"><p class="kicker">THANK YOU FOR YOUR INTEREST</p><h1>Thank you for your time.</h1><p class="lead">${esc(SCREEN_OUT_TEXT)}</p></div><div class="card"><p>No response has been submitted.</p><button class="secondary" id="change-screening">Change my answer</button></div>`;
    document.querySelector('#change-screening').onclick=()=>{state.answers={};state.sectionId=schema.sections[0].id;state.review=false;save();render(true);};
    if(scroll){window.scrollTo({top:0});app.focus();}return;
  }
  if(state.review){
    const answered=Object.entries(state.answers).filter(([key,value])=>!key.includes('__')&&value!==''&&value!==undefined).length;
    app.innerHTML=`<div class="hero"><p class="kicker">READY TO SUBMIT</p><h1>Thank you for sharing your perspective.</h1><p class="lead">Your answers are ready. Submit them to the research team below.</p></div>${!validEndpoint()?'<div class="notice warning"><strong>Preview mode — submission is not connected.</strong> The survey owner must configure the Google Sheets submission URL before collecting responses. You can test the survey and download a local backup.</div>':'<div class="notice">Submitting sends your answers to the research team’s private Google Sheet. Wait for the next page to confirm that your response was saved.</div>'}<div class="card"><h2>Your response</h2><div class="summary-grid"><div>Answered fields<strong>${answered}</strong></div><div>Survey version<strong>${esc(schema.version)}</strong></div></div><p class="hint">You may go back and edit your answers before submitting.</p><div class="actions"><button class="secondary" id="edit">Back to survey</button><button class="primary" id="submit-response" ${validEndpoint()?'':'disabled'}>Submit response</button></div><p class="hint" id="submit-status" role="status"></p></div><div class="card"><h2>Optional backup</h2><p class="muted">Download a copy for your records. <strong>A download is not a submission.</strong></p><div class="actions"><button class="secondary" id="json">Download JSON</button><button class="secondary" id="csv">Download CSV</button></div><p class="hint" id="download-status" role="status"></p></div>`;
    document.querySelector('#edit').onclick=()=>{state.review=false;save();render(true);};document.querySelector('#json').onclick=()=>downloadRecord('json');document.querySelector('#csv').onclick=()=>downloadRecord('csv');document.querySelector('#submit-response').onclick=submit;
  }else{
    const sections=shownSections(),section=sections.find(s=>s.id===state.sectionId)||sections[0];state.sectionId=section.id;
    const index=sections.indexOf(section),isFirst=index===0;
    app.innerHTML=`${isFirst?`<div class="hero"><p class="kicker">CAMPUS MOBILITY STUDY</p><h1>A better way<br>around campus?</h1><div class="intro">${schema.intro.map(p=>`<p>${esc(p)}</p>`).join('')}</div></div>${!validEndpoint()?'<div class="notice warning"><strong>Preview mode.</strong> Online submission is not yet connected. Responses can only be downloaded on this device until setup is complete.</div>':'<div class="notice">Your completed answers will be sent to the research team’s private Google Sheet when you select “Submit response.”</div>'}<p class="hint">Your draft is saved in this browser tab. You can stop at any time. Please do not enter personal identifying details in free-text answers.</p>`:''}<div class="progress-row"><span>Section ${schema.sections.indexOf(section)+1} of ${schema.sections.length}</span><span>Required questions are marked *</span></div><div class="progress-track" role="progressbar" aria-valuenow="${schema.sections.indexOf(section)+1}" aria-valuemin="0" aria-valuemax="${schema.sections.length}" aria-label="Survey progress"><div class="progress-fill" style="width:${((schema.sections.indexOf(section)+1)/schema.sections.length)*100}%"></div></div><div class="hero"><p class="kicker">${esc(section.title.split(' – ')[0])}</p><h2>${esc(section.title.split(' – ').slice(1).join(' – ')||section.title)}</h2>${section.description?`<p class="lead section-description">${esc(section.description)}</p>`:''}</div>${section.id==='interest'?productIntroHtml(schema.productIntro):''}${section.id==='pricing'?`<div class="notice">${esc(schema.pricingIntro)}</div>`:''}${errors.length?`<div class="notice error" role="alert" tabindex="-1">Please complete or correct the highlighted fields below.</div>`:''}<form id="survey-form" novalidate><div class="card">${shownQuestions(section).map(questionHtml).join('')}</div><div class="actions">${index?'<button type="button" class="secondary" id="back">Back</button>':''}<button type="submit" class="primary">${section.id===schema.sections.at(-1).id?'Review & finish':'Continue'}</button><button type="button" class="quiet" id="reset">Start over</button></div></form>${!storageAvailable?'<p class="hint">Your browser has disabled draft storage. Keep this page open to avoid losing answers.</p>':''}`;
    document.querySelector('#survey-form').onsubmit=e=>{e.preventDefault();next();};document.querySelector('#back')?.addEventListener('click',()=>move(-1));document.querySelector('#reset').onclick=startOver;
    app.querySelectorAll('[data-key]').forEach(input=>{
      const kind=input.dataset.kind;
      const handler=()=>{
        const key=input.dataset.key;
        if(kind==='multi'){
          const question=allQuestions(schema).find(q=>q.id===key.split('_')[0]);
          state.answers[key]=updateMultiSelection(question,state.answers[key],Number(input.value),input.checked);
        }
        else if(kind==='single'||kind==='scale')state.answers[key]=Number(input.value);
        else state.answers[key]=input.value;
        state.answers=cleanAnswers(schema,state.answers);state.completedAt=null;errors=errors.filter(e=>e.key!==key);save();
        if(['single','multi','scale'].includes(kind)){
          const name=input.name, val=input.value;render();app.querySelector(`[name="${CSS.escape(name)}"][value="${CSS.escape(val)}"]`)?.focus({preventScroll:true});
        }
      };
      input.addEventListener(['text','number'].includes(kind)?'input':'change',handler);
    });
  }
  if(config.reviewNotice)app.insertAdjacentHTML('afterbegin',`<div class="notice warning review-notice" role="note">${esc(config.reviewNotice)}</div>`);
  if(scroll){window.scrollTo({top:0});app.focus();}
}
try{
  const [schemaResult,configResult]=await Promise.all([fetch('./survey.json?v=3.3'),fetch('./config.json?v=3.3')]);
  if(!schemaResult.ok||!configResult.ok)throw new Error('The survey configuration could not be loaded.');
  schema=await schemaResult.json();config=await configResult.json();
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');state=saved?.version===schema.version?saved:freshState();}catch{state=freshState();storageAvailable=false;}
  if(!Array.isArray(state.planOrder)||state.planOrder.map(Number).sort().join(',')!=='1,2,3')state.planOrder=shuffledPlans();
  state.answers=cleanAnswers(schema,state.answers||{});save();
  document.querySelector('.site-footer').textContent=validEndpoint()?`Student research · Survey ${schema.version} · Responses are submitted only when you choose to submit.`:'Student research · Preview mode · No online response collection is configured.';
  render();
}catch(error){app.innerHTML=`<div class="notice error"><strong>The survey could not load.</strong><p>${esc(error.message)}</p><p>Open the site through GitHub Pages or a local web server, rather than opening the HTML file directly.</p></div>`;}
