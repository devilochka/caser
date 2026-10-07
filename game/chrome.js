const frame = document.querySelector('#game');
const route = () => location.hash || '#/inventory';
const pageNames = {inventory:'Инвентарь CS2',cases:'Кейсы CS2',upgrade:'Апгрейд предметов CS2',rewards:'Награды',profile:'Профиль'};
function updateChrome() {
  const path = route().replace(/^#\/?/, '');
  const [page, slug] = path.split('/');
  const knownPage = Object.hasOwn(pageNames, page) ? page : 'inventory';
  const url = 'https://caser.one' + (knownPage === 'upgrade' ? '/ru' : '/ru/' + (knownPage === 'cases' && slug ? path : knownPage));
  const title = 'КЕЙСЕР (CASER) - Официальный Сайт | ' + pageNames[knownPage];
  const address = document.querySelector('#address-text');
  const scheme = document.createElement('span');
  scheme.textContent = 'https://';
  const domain = document.createElement('span');
  domain.className = 'address-domain';
  domain.textContent = 'caser.one';
  const suffix = document.createElement('span');
  suffix.textContent = url.slice('https://caser.one'.length);
  address.replaceChildren(scheme, domain, suffix);
  address.title = url;
  const tab = document.querySelector('#tab-title');
  tab.textContent = title; tab.title = title; document.title = title;
}
frame.src = '/game.html' + location.search + route(); updateChrome();
// Scale both editable text regions from the same 2559px reference coordinates.
// Rounding each position separately made the tab caption drift at some widths.
function alignAddressText() {
  const width = document.querySelector('#chrome').getBoundingClientRect().width;
  if (!width) return;
  const scale = width / 2559;
  const address = document.querySelector('#address-text');
  address.style.left = 158 * scale + 'px';
  address.style.top = 45 * scale + 'px';
  address.style.height = 32 * scale + 'px';
  address.style.fontSize = 14 * scale + 'px';
  const tab = document.querySelector('#tab-title');
  tab.style.left = 72 * scale + 'px';
  tab.style.top = 8 * scale + 'px';
  tab.style.height = 24 * scale + 'px';
  tab.style.lineHeight = 24 * scale + 'px';
  tab.style.fontSize = 13 * scale + 'px';
}
new ResizeObserver(alignAddressText).observe(document.querySelector('#chrome'));
frame.addEventListener('load', () => {
  frame.contentWindow.addEventListener('hashchange', () => {
    const hash = frame.contentWindow.location.hash;
    if (hash !== location.hash) history.replaceState(null, '', hash);
    updateChrome();
  }); updateChrome();
});
window.addEventListener('hashchange', () => {
  if (frame.contentWindow.location.hash !== route()) frame.contentWindow.location.hash = route();
  updateChrome();
});
document.querySelector('#back').onclick = () => frame.contentWindow.history.back();
document.querySelector('#forward').onclick = () => frame.contentWindow.history.forward();
document.querySelector('#reload').onclick = () => frame.contentWindow.location.reload();
document.querySelector('#fullscreen').onclick = () => document.documentElement.requestFullscreen().catch(() => {});
document.querySelector('#exit-fullscreen').onclick = () => document.fullscreenElement && document.exitFullscreen();
const browserMockKey = 'caser-pc-browser-mock';
window.browserMockEnabled = false;
window.setBrowserMock = (enabled) => {
  window.browserMockEnabled = Boolean(enabled);
  document.body.classList.toggle('compact', !window.browserMockEnabled);
  alignAddressText();
  document.querySelector('#restore').hidden = true;
  try { localStorage.setItem(browserMockKey, String(window.browserMockEnabled)); } catch {}
};
try { window.setBrowserMock(localStorage.getItem(browserMockKey) === 'true'); } catch { window.setBrowserMock(false); }
document.querySelector('#minimize').onclick = () => window.setBrowserMock(false);
document.querySelector('#restore').onclick = () => window.setBrowserMock(true);
