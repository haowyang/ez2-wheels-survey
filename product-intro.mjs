const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
  character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

export function productIntroHtml(intros) {
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
