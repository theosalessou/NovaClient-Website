(() => {
'use strict';
const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)'),button=document.querySelector('#motion-toggle');
let paused=false;
function syncMotion(){const still=paused||reduced.matches;root.classList.toggle('motion-off',still);button.disabled=reduced.matches;button.textContent=reduced.matches?'Reduced motion':still?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(still));}
button.addEventListener('click',()=>{paused=!paused;syncMotion();});reduced.addEventListener('change',syncMotion);syncMotion();
const dialogs=[...document.querySelectorAll('dialog')];let returnFocus=null;
function openPanel(id){const panel=document.getElementById(id);if(!dialogs.includes(panel))return false;if(!dialogs.some(d=>d.open))returnFocus=document.activeElement;dialogs.forEach(d=>{if(d.open&&d!==panel)d.close();});if(!panel.open)panel.showModal();root.classList.add('panel-open');document.dispatchEvent(new Event('orbitpanelchange'));return true;}
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link)return;const url=new URL(link.href,location.href);if(url.origin!==location.origin||!url.hash)return;let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{return;}if(openPanel(id))event.preventDefault();});
for(const panel of dialogs){panel.addEventListener('click',e=>{if(e.target!==panel)return;const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();});panel.addEventListener('close',()=>{if(dialogs.some(d=>d.open))return;root.classList.remove('panel-open');returnFocus?.focus();document.dispatchEvent(new Event('orbitpanelchange'));});}
function deepLink(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}openPanel(id);}
addEventListener('hashchange',deepLink);deepLink();
const progress=document.querySelector('.reading-progress');let frame=0;
function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(()=>{frame=0;progress.style.transform=`scaleX(${Math.min(1,scrollY/Math.max(1,root.scrollHeight-innerHeight))})`;});}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});schedule();
const base='https://github.com/theosalessou/NovaClient-Dist/releases/',status=document.querySelector('#release-status');
fetch('https://api.github.com/repos/theosalessou/NovaClient-Dist/releases?per_page=8',{signal:AbortSignal.timeout(7000)})
.then(r=>{if(!r.ok)throw Error();return r.json();}).then(all=>{
 const releases=all.filter(r=>!r.draft&&r.html_url?.startsWith(base+'tag/')).sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));
 const assets=releases.flatMap(r=>r.assets||[]),win=assets.find(a=>/^NovaClient-.*-win64\.zip$/i.test(a.name)&&a.browser_download_url?.startsWith(base+'download/')),linux=assets.find(a=>/^NovaClient-.*linux[-_]x86_64.*\.zip$/i.test(a.name)&&a.browser_download_url?.startsWith(base+'download/'));
 if(win){document.querySelector('[data-download]').href=win.browser_download_url;status.textContent=win.name;}else status.textContent='Choose a Windows package from official releases.';
 if(linux){document.querySelector('#linux-download').href=linux.browser_download_url;document.querySelector('#linux-release-status').textContent=linux.name;}
}).catch(()=>{status.textContent='Release lookup unavailable. The links still open official releases.';});
})();
