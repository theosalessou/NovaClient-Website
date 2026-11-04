import {animate, inView, hover, press, stagger} from "motion";
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const toggle = document.querySelector("#motion-toggle");
let paused = false;
try { paused = localStorage.getItem("nova-site-motion-paused") === "1"; } catch {}
let stopView = () => {};
const active = new Map();
const touched = new Set();
const allowed = () => !paused && !reduced.matches && !document.hidden;
function play(el, values, options = {}) {
  active.get(el)?.stop();
  if (!allowed()) return;
  touched.add(el);
  const animation = animate(el, values, options);
  active.set(el, animation);
  animation.then(() => { if (active.get(el) === animation) active.delete(el); });
}
function clearMotion() {
  stopView();
  active.forEach(a => a.stop()); active.clear();
  touched.forEach(el => { el.style.opacity = ""; el.style.transform = ""; });
  touched.clear();
}
function resetMotion() {
  clearMotion();
  if (toggle) { toggle.setAttribute("aria-pressed", String(paused)); toggle.textContent = paused ? "Resume motion" : "Pause motion"; }
  if (!allowed()) return;
  stopView = inView(".reveal", el => {
    play(el, {opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"]}, {duration: .5, ease: "easeOut"});
  }, {margin: "0px 0px -25px 0px"});
}
toggle?.addEventListener("click", () => {
  paused = !paused;
  try { localStorage.setItem("nova-site-motion-paused", paused ? "1" : "0"); } catch {}
  resetMotion();
});
reduced.addEventListener("change", resetMotion);
document.addEventListener("visibilitychange", resetMotion);
// Real image panels. No-JS fallback keeps every capture and caption visible.
for (const explorer of document.querySelectorAll("[data-explorer]")) {
  const tabs = [...explorer.querySelectorAll("[data-feature-tab]")];
  const panels = [...explorer.querySelectorAll("[data-feature-panel]")];
  const list = explorer.querySelector(".feature-switcher");
  list.setAttribute("role", "tablist");
  let index = 0;
  function select(next, focus = false, animated = true) {
    index = (next + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      tab.disabled = false;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      active.get(panels[i])?.stop();
      panels[i].setAttribute("role", "tabpanel");
      panels[i].hidden = i !== index;
      panels[i].style.opacity = ""; panels[i].style.transform = "";
    });
    if (focus) tabs[index].focus();
    if (animated) play(panels[index], {opacity: [0, 1], transform: ["translateX(12px)", "translateX(0px)"]}, {duration: .28, ease: "easeOut"});
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = index + 1;
      if (event.key === "ArrowLeft") next = index - 1;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); select(next, true);
    });
  });
  select(0, false, false);
}
// Interruptible gestures, only on actual controls; no mouse-following render loop.
hover(".feature-image, .nova-download, .downloads .button", el => {
  play(el, {transform: "translateY(-3px)"}, {type: "spring", duration: .3, bounce: .1});
  return () => play(el, {transform: "translateY(0px)"}, {type: "spring", duration: .3, bounce: .1});
});
press(".feature-switcher button", el => {
  play(el, {transform: "scale(.96)"}, {duration: .1});
  return () => play(el, {transform: "scale(1)"}, {type: "spring", duration: .25, bounce: .1});
});
// Native modal supplies focus containment and Escape; links still work without JS.
const dialog = document.querySelector(".image-dialog");
let opener;
if (dialog && typeof dialog.showModal === "function") {
  const image = dialog.querySelector("img");
  const title = dialog.querySelector("#image-dialog-title");
  document.querySelectorAll("[data-zoom]").forEach(link => link.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    opener = link;
    image.src = link.href; image.alt = link.querySelector("img").alt;
    title.textContent = image.alt;
    dialog.showModal(); event.preventDefault();
    play(dialog, {opacity: [0, 1], transform: ["translateY(16px) scale(.985)", "translateY(0px) scale(1)"]}, {duration: .24, ease: "easeOut"});
  }));
  dialog.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener("close", () => { active.get(dialog)?.stop(); dialog.style.opacity = ""; dialog.style.transform = ""; opener?.focus(); });
}
resetMotion();
// One staggered entrance; no autoplay or continuously animated background.
if (allowed()) {
  const links = document.querySelectorAll(".nova-nav > a");
  // Individual controls remain visible without JavaScript, even on slow devices.
  links.forEach((el, i) => play(el, {opacity: [0, 1], transform: ["translateY(-5px)", "translateY(0px)"]}, {duration: .3, delay: stagger(.045)(i, links.length), ease: "easeOut"}));
}
