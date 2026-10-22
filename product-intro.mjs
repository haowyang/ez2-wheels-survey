const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
  character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

export function productIntroHtml(intros) {
  const products = intros.map(intro => {
    const [title, ...lines] = String(intro).split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    return {title, details:lines.map(line=>{
      const at=line.indexOf(':');
      return {label:at<0?'':line.slice(0,at),text:at<0?line:line.slice(at+1).trim()};
    })};
  });
  const shared = products.length===2 && products[0].details.length>0 &&
    products[0].details.every((detail,index)=>detail.label && detail.label===products[1].details[index]?.label) &&
    products[0].details.length===products[1].details.length;
  if(shared) return `<div class="product-comparison"><table role="table"><caption class="sr-only">Compare the two offerings using the same features.</caption><thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Feature</th>${products.map(p=>`<th scope="col" role="columnheader">${escapeHtml(p.title)}</th>`).join('')}</tr></thead><tbody role="rowgroup">${products[0].details.map((detail,index)=>`<tr role="row"><th scope="row" role="rowheader">${escapeHtml(detail.label)}</th>${products.map(p=>`<td role="cell"><span class="mobile-product" aria-hidden="true">${escapeHtml(p.title)}</span>${escapeHtml(p.details[index].text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<div class="product-intro-grid">${intros.map(intro => {
    const lines = String(intro).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) return `<article class="product-intro-card"><p>${escapeHtml(lines[0] || '')}</p></article>`;
    const [title, ...details] = lines;
    return `<article class="product-intro-card"><h3>${escapeHtml(title)}</h3><ul>${details.map(detail => {
      const separator = detail.indexOf(':');
      return `<li>${separator < 0 ? escapeHtml(detail) : `<strong>${escapeHtml(detail.slice(0, separator))}:</strong> ${escapeHtml(detail.slice(separator + 1).trim())}`}</li>`;
    }).join('')}</ul></article>`;
  }).join('')}</div>`;
}
