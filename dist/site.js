(() => {
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let motion = !reduced.matches, frame = 0;
const wordmark = $('#hero-title');
const progress = $('.reading-progress');
function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(render); }
function render() {
  frame = 0;
  const scrollable = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / scrollable))})`;
}
function syncMotion() {
  root.classList.toggle('motion-off', !motion);
  if (!motion) {
    document.getAnimations().forEach(a => a.cancel());
    $$('.magnetic').forEach(el => el.style.removeProperty('transform'));
    wordmark.style.removeProperty('--word-y');
  }
  schedule();
}
reduced.addEventListener('change', e => { motion = !e.matches; syncMotion(); });
syncMotion();
// Animate the already-visible content; script failure never conceals information.
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    observer.unobserve(el);
    const siblings = [...el.parentElement.children];
    const delay = Math.min(siblings.indexOf(el), 3) * 75;
    if (motion) {
      el.style.setProperty('--entrance-delay', `${delay}ms`);
      el.classList.add('entered');
    }
  });
}, { threshold: .12 });
$$('.reveal').forEach(el => observer.observe(el));
$$('#hero-title span').forEach((el, i) => el.style.setProperty('--letter-delay', `${i * 28}ms`));
if (motion) $('#hero-title').classList.add('wordmark-live');
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
  else schedule();
});
$$('.magnetic').forEach(el => {
  el.addEventListener('pointermove', e => {
    if (!motion || !finePointer.matches) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .045}px,${(e.clientY - r.top - r.height / 2) * .12}px)`;
  });
  const reset = () => el.style.removeProperty('transform');
  el.addEventListener('pointerleave', reset); el.addEventListener('blur', reset);
});
$$('details').forEach(el => el.addEventListener('toggle', () => {
  if (!el.open) return;
  const group = el.closest('[data-accordion-group]');
  if (group) group.querySelectorAll('details').forEach(other => { if (other !== el) other.open = false; });
  schedule();
}));
const releaseBase = 'https://github.com/theosalessou/NovaClient-Dist/releases/';
// Progressive enhancement: the complete catalogue remains readable without JS.
const search = $('#tool-search');
const featureRows = $$('.tool-grid li');
let category = 'All';
$('.tool-controls').hidden = false;
function filterTools() {
  const query = search.value.trim().toLocaleLowerCase('en');
  let count = 0;
  featureRows.forEach(row => {
    const match = (category === 'All' || row.dataset.category === category) && row.textContent.toLocaleLowerCase('en').includes(query);
    row.hidden = !match;
    if (match) count++;
  });
  $('#tool-count').textContent = `${count} ${count === 1 ? 'feature' : 'features'}`;
  $('#tool-empty').hidden = count !== 0;
  schedule();
}
search.addEventListener('input', filterTools);
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  $$('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  filterTools();
}));
filterTools();
const journeyLinks = $$('.journey a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    journeyLinks.forEach(link => {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-10% 0px -55% 0px' });
['inputs', 'features', 'download'].forEach(id => sectionObserver.observe(document.getElementById(id)));
fetch('https://api.github.com/repos/theosalessou/NovaClient-Dist/releases?per_page=8', { signal: AbortSignal.timeout(7000) })
  .then(r => { if (!r.ok) throw Error(); return r.json(); })
  .then(releases => {
    const linuxLink = $('#linux-download');
    if (linuxLink) {
      const published = releases.filter(r => !r.draft && r.html_url?.startsWith(releaseBase + 'tag/')).sort((a,b) => Date.parse(b.published_at)-Date.parse(a.published_at));
      const linuxAsset = published.flatMap(r => r.assets || []).find(a => /^NovaClient-.*linux[-_]x86_64.*\.zip$/i.test(a.name) && a.browser_download_url?.startsWith(releaseBase + 'download/'));
      if (linuxAsset) { linuxLink.href=linuxAsset.browser_download_url; linuxLink.setAttribute('aria-label','Download NovaClient for Linux x86_64'); $('#linux-release-status').textContent=linuxAsset.name; }
    }
    const asset = r => r.assets?.find(a => /^NovaClient-.*-win64\.zip$/i.test(a.name) && a.browser_download_url?.startsWith(releaseBase + 'download/'));
    const release = releases.filter(r => !r.draft && r.html_url?.startsWith(releaseBase + 'tag/') && asset(r)).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0];
    if (!release) throw Error();
    $('[data-download]').href = asset(release).browser_download_url;
    $('#release-status').textContent = release.tag_name + ' · Windows x64';
  })
  .catch(() => { $('#release-status').textContent = 'Choose a version on the official releases page'; });
$('#copy-download').addEventListener('click', async () => {
  const button = $('#copy-download');
  try { await navigator.clipboard.writeText($('[data-download]').href); button.textContent = 'Link copied'; }
  catch { button.textContent = 'Use the download link'; }
  setTimeout(() => { button.textContent = 'Copy Windows link'; }, 2500);
});
const pixButton = document.getElementById('copy-pix');
if (pixButton) pixButton.addEventListener('click', async () => {
  const field = document.getElementById('pix-code');
  try {
    await navigator.clipboard.writeText(field.value);
    document.getElementById('pix-status').textContent = 'Pix code copied. Open your banking app and choose Pix copy and paste.';
  } catch {
    field.focus(); field.select();
    document.getElementById('pix-status').textContent = 'Select and copy the Pix code above.';
  }
});
})();
