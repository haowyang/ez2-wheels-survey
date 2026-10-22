/* Pure survey rules shared by the browser, exports and Node tests. No browser APIs. */
export const PRODUCT_NAMES = {S:'Electric scooter (eZ2 S)',B:'Electric bike (eZ2 B)'};
export const allQuestions = schema => schema.sections.flatMap(section => section.questions);
export const keyFor = (q, product) => product ? `${q.id}_${product}` : q.id;
export const otherKey = (key, option) => `${key}__${option.value}_text`;
const hasValue = value => value !== undefined && value !== null && value !== '';
const same = (a,b) => String(a) === String(b);
export function conditionMet(condition, answers) {
  if (condition?.includes('||')) return condition.split('||').some(part=>conditionMet(part.trim(),answers));
  const eligible = same(answers.Q1, 1);
  const interest = p => Number(answers[`Q16_${p}`]) >= 2 && Number(answers[`Q16_${p}`]) <= 5;
  if (!condition || condition === 'always') return true;
  if (condition === 'eligible') return eligible;
  if (!eligible) return false;
  if (condition === 'experienced') return ['number','string'].includes(typeof answers.Q12) && [2,3,4,5].some(value => same(answers.Q12, value));
  if (condition === 'any_interest') return interest('S') || interest('B');
  if (condition === 'charger_interest') return Number(answers.Q22) >= 2 && Number(answers.Q22) <= 5;
  const [_, p] = condition.match(/_([SB])$/) || [];
  if (condition.startsWith('uninterested_')) return same(answers[`Q16_${p}`], 1);
  if (condition.startsWith('interested_')) return interest(p);
  if (condition.startsWith('chose_plan_')) return interest(p) && [1,2,3].includes(Number(answers[`Q27_${p}`]));
  if (condition.startsWith('chose_none_')) return interest(p) && same(answers[`Q27_${p}`], 4);
  throw new Error(`Unknown condition: ${condition}`);
}
export function visibleProducts(q, answers) {
  return (q.products || ['S','B']).filter(p => conditionMet(q.productConditions?.[p] || q.condition, answers));
}
export function isVisible(q, answers) {
  return conditionMet(q.condition, answers) && (!q.type.startsWith('product_') || visibleProducts(q, answers).length > 0);
}
export function expandedQuestions(schema, answers) {
  return allQuestions(schema).flatMap(q => {
    if (!isVisible(q, answers)) return [];
    return q.type.startsWith('product_')
      ? visibleProducts(q, answers).map(product => ({q, product, key:keyFor(q, product)}))
      : [{q, product:null, key:q.id}];
  });
}
export function cleanAnswers(schema, answers) {
  // Iterate until changes to an upstream answer have removed every hidden descendant.
  let result = {...answers};
  for (let iteration=0; iteration<4; iteration++) {
    const cleaned = {};
    for (const {q,key} of expandedQuestions(schema,result)) {
      if (Object.hasOwn(result,key)) cleaned[key] = result[key];
      for (const option of q.options || []) {
        const selected = Array.isArray(result[key]) ? result[key].some(v => same(v, option.value)) : same(result[key],option.value);
        const detailKey = otherKey(key,option);
        if (option.other && selected && Object.hasOwn(result,detailKey)) cleaned[detailKey] = result[detailKey];
      }
    }
    if (JSON.stringify(result) === JSON.stringify(cleaned)) return cleaned;
    result = cleaned;
  }
  return result;
}
export function validateItem(q,key,answers) {
  const errors=[];
  const value=answers[key];
  const type=q.type.replace('product_','');
  const empty=!hasValue(value) || (type==='multi' && Array.isArray(value) && value.length===0);
  if (empty) return q.required ? [{key,message:'Please answer this question.'}] : [];
  if (type==='single' || type==='multi') {
    const options=(q.options || []).map(o=>String(o.value));
    const selected=type==='multi' ? value : [value];
    if (!Array.isArray(selected) || selected.some(v=>!['number','string'].includes(typeof v)||!options.includes(String(v))) || (type==='multi' && new Set(selected.map(String)).size!==selected.length)) {
      errors.push({key,message:'Please select a valid answer.'});
    }
  }
  if (type==='number' || type==='scale') {
    const number=typeof value==='number' ? value : Number(String(value).trim());
    if (!['number','string'].includes(typeof value) || (typeof value==='string' && !/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) || !Number.isFinite(number)) errors.push({key,message:'Please enter a valid number.'});
    else if (q.min!==undefined && number<q.min) errors.push({key,message:`Enter a number of at least ${q.min}.`});
    else if (q.max!==undefined && number>q.max) errors.push({key,message:`Enter a number no greater than ${q.max}.`});
    else if ((type==='scale' || q.decimals===0) && !Number.isInteger(number)) errors.push({key,message:'Please enter a whole number.'});
    else if (q.decimals!==undefined && Math.abs(number*10**q.decimals-Math.round(number*10**q.decimals))>1e-7) errors.push({key,message:`Use no more than ${q.decimals} decimal place${q.decimals===1?'':'s'}.`});
  }
  if (type==='text') {
    if (typeof value!=='string') errors.push({key,message:'Please enter text.'});
    else if (!value.trim() && q.required) errors.push({key,message:'Please enter an answer.'});
    else if (q.maxLength && value.length>q.maxLength) errors.push({key,message:`Use ${q.maxLength} characters or fewer.`});
  }
  for (const option of q.options || []) {
    const selected=Array.isArray(value) ? value.some(v=>same(v,option.value)) : same(value,option.value);
    if (!option.other || !selected) continue;
    const detailKey=otherKey(key,option), text=answers[detailKey];
    if (option.otherRequired && (typeof text!=='string' || !text.trim())) errors.push({key:detailKey,message:'Please specify your answer.'});
    else if (hasValue(text) && (typeof text!=='string' || (option.otherMaxLength && text.length>option.otherMaxLength))) errors.push({key:detailKey,message:`Use ${option.otherMaxLength || 100} characters or fewer.`});
  }
  return errors;
}
export function validateAll(schema,answers) {
  const cleaned=cleanAnswers(schema,answers);
  return expandedQuestions(schema,cleaned).flatMap(({q,key})=>validateItem(q,key,cleaned));
}
export function shuffledPlans(rng=Math.random) {
  const result=[1,2,3];
  for (let i=result.length-1;i>0;i--) {const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function orderedOptions(q,planOrder) {
  if (q.id!=='Q27') return q.options || [];
  const options=q.options || [];
  return [...planOrder.map(value=>options.find(o=>same(o.value,value))).filter(Boolean),...options.filter(o=>!planOrder.some(v=>same(v,o.value)))];
}
export function normalizedValue(q,value) {
  if (!hasValue(value)) return '';
  // Keep declared NA codes in raw answers, but exclude them from analysis values.
  if ((q.missingValues || []).some(code => same(code,value))) return '';
  const type=q.type.replace('product_','');
  if (type==='number' || type==='scale') return Number(value);
  if (type==='text') return String(value).trim();
  if (type==='single') return (q.options || []).find(o=>same(o.value,value))?.value ?? value;
  return value;
}
export function makeRecord(schema,input,metadata) {
  const errors=validateAll(schema,input);
  if (errors.length) throw new Error(`The response has ${errors.length} unanswered or invalid field(s).`);
  const answers=cleanAnswers(schema,input), asked={}, flat={};
  const visible=new Set(expandedQuestions(schema,answers).map(item=>item.key));
  for (const q of allQuestions(schema)) {
    const products=q.type.startsWith('product_') ? q.products || ['S','B'] : [null];
    for (const product of products) {
      const key=keyFor(q,product), wasAsked=visible.has(key), suffix=product?`_${product}`:'', base=q.variable || `V_${q.id}`;
      asked[key]=wasAsked;
      const type=q.type.replace('product_',''), value=answers[key];
      if (type==='multi') {
        for (const option of q.options || []) {
          const field=`${base}_${option.value}${suffix}`;
          flat[field]=wasAsked && hasValue(value) ? (value.some(v=>same(v,option.value))?1:0) : '';
          flat[`${field}__asked`]=wasAsked?1:0;
        }
      } else {
        const field=`${base}${suffix}`;
        flat[field]=wasAsked?normalizedValue(q,value):'';
        flat[`${field}__asked`]=wasAsked?1:0;
      }
      for (const option of q.options || []) {
        if (!option.other) continue;
        const field=product ? option.otherFields?.[product] : option.otherField;
        const name=field || `${base}_Other_txt${suffix}`;
        const selected=wasAsked && (Array.isArray(value)?value.some(v=>same(v,option.value)):same(value,option.value));
        flat[name]=selected?String(answers[otherKey(key,option)] || '').trim():'';
        flat[`${name}__asked`]=selected?1:0;
        asked[otherKey(key,option)]=selected;
      }
    }
  }
  return {schemaVersion:schema.version,surveyTitle:schema.title,responseId:metadata.responseId,startedAt:metadata.startedAt,completedAt:metadata.completedAt,planOrder:metadata.planOrder,answers,asked,flat};
}
export function csvCell(value) {
  let text=value===null || value===undefined?'':String(value);
  // Preserve numeric values while preventing spreadsheet formula execution in text.
  if (typeof value==='string' && /^[=+\-@\t\r]/.test(text)) text=`'${text}`;
  return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}
export function recordsToCsv(records) {
  if (!records.length) return '';
  if (new Set(records.map(record=>record.schemaVersion)).size!==1) throw new Error('Do not combine different survey versions in one CSV export.');
  const fields=[...new Set(records.flatMap(record=>Object.keys(record.flat)))];
  const meta=['response_id','schema_version','started_at','completed_at','plan_order'];
  const lines=[[...meta,...fields].map(csvCell).join(',')];
  for (const r of records) lines.push([r.responseId,r.schemaVersion,r.startedAt,r.completedAt,(r.planOrder||[]).join('|'),...fields.map(field=>r.flat[field]??'')].map(csvCell).join(','));
  return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
export function verifyImportedRecord(schema,record) {
  if (!record || record.schemaVersion!==schema.version) throw new Error('Survey version does not match.');
  if (typeof record.responseId!=='string' || !/^[a-zA-Z0-9-]{8,80}$/.test(record.responseId)) throw new Error('Missing or invalid response ID.');
  if (!record.answers || typeof record.answers!=='object' || Array.isArray(record.answers)) throw new Error('Missing response answers.');
  if (!same(record.answers.Q1,1)) throw new Error('This is not an eligible completed response.');
  if (!Array.isArray(record.planOrder) || record.planOrder.map(Number).sort().join(',')!=='1,2,3') throw new Error('Invalid plan order.');
  if (!Number.isFinite(Date.parse(record.startedAt)) || !Number.isFinite(Date.parse(record.completedAt))) throw new Error('Invalid response dates.');
  // Recompute all export data; imported flat/asked values are not trusted.
  return makeRecord(schema,record.answers,record);
}
