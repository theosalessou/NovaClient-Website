(() => {
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let motion = !reduced.matches, frame = 0, pointerActive = false;
let targetX = innerWidth / 2, targetY = innerHeight / 2, lightX = targetX, lightY = targetY;
const hero = $('.hero'), wordmark = $('.wordmark-wrap'), light = $('.pointer-light');
const progress = $('.reading-progress'), download = $('.download');
function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(render); }
function render() {
  frame = 0;
  const scrollable = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / scrollable))})`;
  if (!motion) return;
  const heroBottom = hero.getBoundingClientRect().bottom;
  if (heroBottom > 0) wordmark.style.setProperty('--word-y', `${Math.min(scrollY * .055, 28)}px`);
  if (pointerActive && finePointer.matches) {
    lightX += (targetX - lightX) * .09;
    lightY += (targetY - lightY) * .09;
    light.style.transform = `translate3d(${lightX - 230}px,${lightY - 230}px,0)`;
    if (Math.abs(targetX - lightX) + Math.abs(targetY - lightY) > .3) schedule();
  }
}
function syncMotion() {
  root.classList.toggle('motion-off', !motion);
  const button = $('.motion-toggle');
  button.setAttribute('aria-pressed', String(motion));
  button.setAttribute('aria-label', motion ? 'Pause animations' : 'Enable animations');
  $('.motion-symbol').textContent = motion ? 'Ⅱ' : '▷';
  if (!motion) {
    document.getAnimations().forEach(a => a.cancel());
    $$('.magnetic').forEach(el => el.style.removeProperty('transform'));
    wordmark.style.removeProperty('--word-y');
  }
  schedule();
}
$('.motion-toggle').addEventListener('click', () => { motion = !motion; syncMotion(); });
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
addEventListener('pointermove', e => {
  if (!motion || !finePointer.matches) return;
  pointerActive = true;
  targetX = e.clientX; targetY = e.clientY;
  root.classList.add('pointer-present');
  schedule();
}, { passive: true });
document.addEventListener('pointerleave', () => { pointerActive = false; root.classList.remove('pointer-present'); });
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
download.addEventListener('pointermove', e => {
  if (motion && finePointer.matches) download.style.setProperty('--download-x', `${(e.clientX / innerWidth - .5) * 120}px`);
}, { passive: true });
$$('details').forEach(el => el.addEventListener('toggle', () => {
  if (!el.open) return;
  $$('details').forEach(other => { if (other !== el) other.open = false; });
  schedule();
}));
const releaseBase = 'https://github.com/theosalessou/NovaClient-Dist/releases/';
fetch('https://api.github.com/repos/theosalessou/NovaClient-Dist/releases?per_page=8', { signal: AbortSignal.timeout(7000) })
  .then(r => { if (!r.ok) throw Error(); return r.json(); })
  .then(releases => {
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
  setTimeout(() => { button.textContent = 'Copy link'; }, 2500);
});
})();
