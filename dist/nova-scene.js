// A small travelling canvas follows the page; only its CSS transform moves.
// The 3D renderer draws on input and sleeps as soon as the interaction settles.
const canvas = document.querySelector('#nova-scene');
const wrap = canvas.parentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const anchor = document.createElement('div');
anchor.className = 'scene-anchor';
anchor.setAttribute('aria-hidden', 'true');
wrap.before(anchor);
document.body.append(wrap);
wrap.classList.add('scene-traveller');
let visible = false, loading = false, failed = false, controller = null;
let frame = 0, needsLayout = true, current = null, destination, lastTime = 0;
let pointerX = 0, pointerY = 0, energy = 0, chapter = 0;
const tones = [0x9462cf, 0x8251bf, 0x7960b1, 0x9a60bd, 0x9462cf];
function paused() { return reduced.matches || document.documentElement.classList.contains('motion-off'); }
function enabled() { return visible && !document.hidden && !paused() && !navigator.connection?.saveData; }

function pose() {
  controller?.setPose({
    x: .12 + pointerY * .22 + Math.sin(chapter) * .08,
    y: -.3 + pointerX * .5 + scrollY * .00075 + energy * .16,
    z: -.18 + Math.min(1, scrollY / innerHeight) * .2,
    tone: tones[chapter % tones.length], energy
  });
}
function layout() {
  const rect = anchor.getBoundingClientRect();
  const progress = paused() ? 0 : Math.min(1, Math.max(0, -rect.top / (innerHeight * .65)));
  const heroSize = Math.min(rect.width, rect.height);
  const smallSize = Math.min(innerWidth * (innerWidth < 761 ? .46 : .32), innerWidth < 761 ? 190 : 360);
  const size = heroSize + (smallSize - heroSize) * progress;
  const heroX = rect.left + rect.width / 2 - size / 2;
  const heroY = rect.top + rect.height / 2 - size / 2;
  destination = {
    x: heroX + (innerWidth - size - 16 - heroX) * progress,
    y: heroY + (innerHeight * .5 - size / 2 - heroY) * progress,
    size, opacity: 1 - progress * .7
  };
}
function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(update); }
function update(time) {
  frame = 0;
  if (document.hidden) return;
  if (needsLayout) { layout(); needsLayout = false; }
  if (!current) current = { ...destination };
  const delta = lastTime ? Math.min(.05, (time - lastTime) / 1000) : 1 / 60;
  lastTime = time;
  const ease = paused() ? 1 : 1 - Math.exp(-14 * delta);
  let settling = false;
  for (const key of ['x', 'y', 'size', 'opacity']) {
    current[key] += (destination[key] - current[key]) * ease;
    const tolerance = key === 'opacity' ? .001 : .15;
    if (Math.abs(destination[key] - current[key]) > tolerance) settling = true;
    else current[key] = destination[key];
  }
  wrap.style.transform = `translate3d(${current.x}px,${current.y}px,0) scale(${current.size / 480})`;
  wrap.style.opacity = String(current.opacity);
  pose();
  if (settling) schedule();
}
async function sync() {
  if (controller) { controller.setActive(enabled()); if (enabled()) pose(); return; }
  if (!enabled() || loading || failed) return;
  loading = true;
  try {
    const { createEmblem } = await import('./nova-emblem.js?v=2');
    if (!enabled()) return;
    controller = createEmblem(canvas);
    controller.setActive(true);
    pose();
  } catch (error) {
    failed = true;
    wrap.classList.remove('webgl-ready');
    console.warn('Nova 3D unavailable; showing original emblem.', error);
  } finally { loading = false; }
}
const visibility = new IntersectionObserver(entries => {
  visible = entries.at(-1).isIntersecting && entries.at(-1).intersectionRatio > 0;
  sync();
});
layout(); update(0);
visibility.observe(wrap);
const sections = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    chapter = Number(entry.target.dataset.scene ?? ({ about: 0, inputs: 1, download: 4 }[entry.target.id] ?? 3));
    schedule();
  }
}, { rootMargin: '-15% 0px -45% 0px' });
document.querySelectorAll('[data-scene],#about,#inputs,#download,.community').forEach(element => sections.observe(element));
addEventListener('scroll', () => { needsLayout = true; schedule(); }, { passive: true });
addEventListener('resize', () => { needsLayout = true; schedule(); }, { passive: true });
document.addEventListener('pointermove', event => {
  if (paused() || event.pointerType === 'touch') return;
  pointerX = event.clientX / innerWidth - .5;
  pointerY = event.clientY / innerHeight - .5;
  schedule();
}, { passive: true });
document.addEventListener('pointerleave', () => { pointerX = pointerY = energy = 0; schedule(); });
const interactive = 'a,button,summary,.input-modes li,.platform-download';
document.addEventListener('pointerover', event => {
  const target = event.target.closest(interactive);
  if (!target || target.contains(event.relatedTarget) || paused()) return;
  energy = 1; schedule();
}, { passive: true });
document.addEventListener('pointerout', event => {
  const target = event.target.closest(interactive);
  if (!target || target.contains(event.relatedTarget)) return;
  energy = 0; schedule();
}, { passive: true });
function preferences() { needsLayout = true; schedule(); sync(); }
reduced.addEventListener('change', preferences);
navigator.connection?.addEventListener('change', sync);
const motion = new MutationObserver(preferences);
motion.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
  else { needsLayout = true; lastTime = 0; schedule(); }
  sync();
});
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); failed = true; controller?.dispose(); controller = null;
  wrap.classList.remove('webgl-ready');
});
addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; controller?.setActive(false); });
addEventListener('pageshow', preferences);
