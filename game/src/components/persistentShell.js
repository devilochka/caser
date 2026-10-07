// The header and live feed belong to the application, not to a routed page.
let mounted = false;
export async function preloadPageStyles(templates) {
  const links = new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map(n => n.getAttribute('href')));
  const anchor = document.querySelector('link[href="./src/style.css"]');
  const ready = [];
  const backgrounds = new Set();
  for (const html of Object.values(templates)) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const img of doc.querySelectorAll('img[src]')) {
      const src = img.getAttribute('src');
      if (/bg-cache|case-bg-poster|headerBG/.test(src)) backgrounds.add(src);
    }
    for (const link of doc.head.querySelectorAll('link[rel="stylesheet"]')) {
      const href = link.getAttribute('href');
      if (links.has(href)) continue;
      links.add(href);
      const node = link.cloneNode(true);
      ready.push(new Promise(resolve => { node.onload = resolve; node.onerror = resolve; }));
      if (href.startsWith('./css/')) document.head.insertBefore(node, anchor);
      else document.head.append(node);
    }
  }
  for (const src of backgrounds) {
    const img = new Image();
    img.src = src;
    void img.decode().catch(() => {});
  }
  await Promise.all(ready);
}
export function mountPage(doc, casesTemplate) {
  document.body.className = doc.body.className;
  document.querySelector('#demo-modal')?.remove();
  if (!mounted) {
    document.body.innerHTML = doc.body.innerHTML;
    const canonical = new DOMParser().parseFromString(casesTemplate, 'text/html');
    document.querySelector('#demo-sidebar').replaceWith(canonical.querySelector('#demo-sidebar').cloneNode(true));
    const layout = document.querySelector('#reference-layout');
    // Some saved mobile pages point their <source> at the DEMO placeholder.
    // Always mount the decoded catalogue backdrop, including on direct profile
    // or inventory visits, so that placeholder cannot cover the entire screen.
    for (const picture of layout.querySelectorAll(':scope > picture')) picture.remove();
    for (const picture of canonical.querySelectorAll('#reference-layout > picture')) layout.append(picture.cloneNode(true));
    mounted = true;
  } else {
    const layout = document.querySelector('#reference-layout');
    const nextLayout = doc.querySelector('#reference-layout');
    layout.className = nextLayout.className;
    const sidebar = document.querySelector('#demo-sidebar');
    const nextSidebar = doc.querySelector('#demo-sidebar');
    const row = sidebar.parentElement;
    const nextRow = nextSidebar.parentElement;
    row.className = nextRow.className;
    const pageBranch = [...row.children].find(n => n !== sidebar);
    const nextBranch = [...nextRow.children].find(n => n !== nextSidebar);
    pageBranch.replaceWith(nextBranch.cloneNode(true));
    // Keep the decoded backdrop mounted, including while a case scene loads.
  }
  // Keep the general backdrop decoded, but use the case's own scene on case pages.
  // Wrapping the fixed image in a negative stacking context hides it behind
  // the catalogue's opaque page background, so retain its original layering.
  const isCasePage = !!doc.querySelector('[data-testid="case-open-case-title"]');
  for (const picture of document.querySelectorAll('#reference-layout > picture')) {
    picture.hidden = isCasePage;
  }
  document.querySelector('#demo-sidebar').className = doc.querySelector('#demo-sidebar').className;
  // Native images render progressively without a hidden class that can leak
  // into cloned templates. Item cards manage their own decode/reveal lifecycle.
  for (const img of document.querySelectorAll('#demo-content img'))
    img.classList.remove('progressive-image-pending');
  for (const link of document.querySelectorAll('#demo-header [data-testid^="header-nav-"]')) {
    const next = doc.querySelector(`[data-testid="${link.dataset.testid}"]`);
    if (next) link.className = next.className;
    if (next?.classList.contains('text-brand-nav-active')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
