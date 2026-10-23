import {isVisible, orderedOptions, PRODUCT_NAMES} from './logic.mjs?v=3.2';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same=(a,b)=>String(a)===String(b);
export const SCREEN_OUT_TEXT='This survey is for people age 18 or older who are currently enrolled as students at a large public university in the U.S.';

export function questionsForSection(section,answers) {
  const rated=id=>['S','B'].every(p=>answers[`${id}_${p}`]!==undefined && answers[`${id}_${p}`]!==null && answers[`${id}_${p}`]!=='');
  return section.questions.filter(q=>isVisible(q,answers) &&
    (q.id!=='Q18' || rated('Q17')) && (q.id!=='Q19' || rated('Q18')));
}

export function pricingOptionsHtml(schema,q,product,key,value,planOrder) {
  const plans=schema.plansByProduct?.[product];
  if(!Array.isArray(plans)) throw new Error(`Pricing information is missing for ${product}.`);
  return `<div class="pricing-table"><table><caption class="sr-only">Pricing options for ${esc(PRODUCT_NAMES[product])}</caption><thead><tr><th scope="col">Choose one plan</th><th scope="col">Price</th><th scope="col">Plan details</th></tr></thead><tbody>${orderedOptions(q,planOrder).map(option=>{
    const plan=plans.find(p=>same(p.value,option.value));
    const detailId=`${key}-plan-${option.value}`;
    return `<tr data-plan="${esc(option.value)}"><th scope="row"><label class="plan-choice"><input type="radio" name="${esc(key)}" data-key="${esc(key)}" data-kind="single" value="${esc(option.value)}" ${same(value,option.value)?'checked':''}${plan?` aria-describedby="${esc(detailId)}"`:''}><span>${esc(option.label)}</span></label></th><td class="plan-price"${plan?` id="${esc(detailId)}"`:''}>${plan?`${esc(plan.price)}<span class="sr-only">; ${esc(plan.description)}</span>`:''}</td><td class="plan-description">${plan?esc(plan.description):''}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
