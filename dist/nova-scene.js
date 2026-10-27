// Load the optional 3D enhancement only when its hero cell is actually visible.
// Deep links such as #download retain the original image without loading Three.js.
const canvas = document.querySelector('#nova-scene');
const wrap = canvas.parentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let visible = false, loading = false, failed = false, controller = null;
const initialTarget = document.getElementById(location.hash.slice(1));
let waitingForAnchor = Boolean(initialTarget && !document.querySelector('.hero').contains(initialTarget));

function enabled() {
  return visible && !waitingForAnchor && !document.hidden && !reduced.matches &&
    !document.documentElement.classList.contains('motion-off') && !navigator.connection?.saveData;
}

async function sync() {
  if (controller) {
    controller.setActive(enabled());
    return;
  }
  if (!enabled() || loading || failed) return;
  loading = true;
  try {
    const { createEmblem } = await import('./nova-emblem.js?v=1');
    // Scrolling away during the download must not create a WebGL context.
    if (!enabled()) return;
    controller = createEmblem(canvas);
    controller.setActive(enabled());
  } catch (error) {
    failed = true;
    wrap.classList.remove('webgl-ready');
    console.warn('Nova 3D unavailable; showing original emblem.', error);
  } finally {
    loading = false;
  }
}

const visibility = new IntersectionObserver(entries => {
  visible = entries.at(-1).isIntersecting && entries.at(-1).intersectionRatio > 0;
  // Native fragment navigation can start after the first observer notification.
  // Wait until it leaves the hero before permitting a later manual return.
  if (waitingForAnchor) {
    if (!visible) waitingForAnchor = false;
    return;
  }
  sync();
});
visibility.observe(wrap);
reduced.addEventListener('change', sync);
navigator.connection?.addEventListener('change', sync);
document.addEventListener('visibilitychange', sync);
const motion = new MutationObserver(sync);
motion.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  failed = true;
  controller?.dispose();
  controller = null;
  wrap.classList.remove('webgl-ready');
});
addEventListener('pagehide', () => controller?.setActive(false));
addEventListener('pageshow', sync);
