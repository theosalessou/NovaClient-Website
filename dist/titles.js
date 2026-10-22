/* Shared client title formulas: one animation loop for profiles and rankings. */
(()=>{'use strict';
const entries=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,paused=reduced.matches;
const clock=performance.now();
function paint(now){frame=0;for(const [root,e] of entries){if(!root.isConnected){entries.delete(root);continue}if(!e.visible)continue;
 const phase=paused?0:(now-clock)/1000*e.title.speed/100;
 e.spans.forEach((span,i)=>{const position=i/Math.max(1,e.spans.length-1),mix=paused?position:.5+.5*Math.sin(position*Math.PI+phase*1.8);
 span.style.color=e.title.mode==='rgb'?`hsl(${((i/12+phase*.22)%1)*360} 100% 60%)`:`rgb(${e.a.map((v,j)=>e.title.mode==='solid'?v:v+(e.b[j]-v)*mix).join(' ')})`;
 span.style.opacity=!paused&&e.title.animation==='pulse'?String(.75+.25*Math.sin(phase*3)):'1';
 span.style.transform=!paused&&e.title.animation==='wave'?`translateY(${Math.sin(phase*3-i*.5)*.09}em)`:'none';});}
 if(!paused&&!document.hidden&&entries.size)frame=requestAnimationFrame(paint);
}
function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
const observer=new IntersectionObserver(items=>{for(const item of items){const e=entries.get(item.target);if(e)e.visible=item.isIntersecting}schedule()});
function attach(root,title){observer.unobserve(root);entries.delete(root);root.replaceChildren();root.hidden=!title;if(!title)return;
 root.classList.add('player-title');root.setAttribute('aria-label',title.name);
 const spans=Array.from(title.name,c=>{const s=document.createElement('span');s.textContent=c===' '?'\u00a0':c;s.setAttribute('aria-hidden','true');root.append(s);return s});
 const rgb=c=>[c>>16&255,c>>8&255,c&255];entries.set(root,{title,spans,a:rgb(title.color1),b:rgb(title.color2),visible:true});observer.observe(root);schedule();}
window.NovaTitles={attach,get paused(){return paused},pause(value){paused=value;cancelAnimationFrame(frame);frame=0;schedule()}};
reduced.addEventListener('change',e=>window.NovaTitles.pause(e.matches));
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;if(!document.hidden)schedule()});
})();
