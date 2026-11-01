import { composeJourney, orbitCard } from './emblem-journey.js?v=11';
const canvas=document.querySelector('#nova-scene'),wrap=canvas.parentElement;
const story=document.querySelector('#anatomy'),root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(hover: hover) and (pointer: fine)');
const anchor=document.createElement('div');anchor.className='scene-anchor';anchor.setAttribute('aria-hidden','true');wrap.before(anchor);
const world=document.createElement('div');world.className='orbital-world';document.body.append(world);world.append(wrap);
wrap.classList.add('scene-traveller');root.classList.add('orbit-enhanced');
const mediaTarget=document.createElement('button');mediaTarget.type='button';mediaTarget.className='orbit-media-hover';mediaTarget.setAttribute('aria-label','Focus original feature image');mediaTarget.hidden=true;document.body.append(mediaTarget);
let hoveredMedia=null;
function mediaEvent(action,pinned=false){if(!hoveredMedia)return;document.dispatchEvent(new CustomEvent('orbitimage',{detail:{action,pinned,...hoveredMedia}}));}
mediaTarget.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')mediaEvent('show');});mediaTarget.addEventListener('pointerleave',()=>mediaEvent('hide'));mediaTarget.addEventListener('focus',()=>mediaEvent('show'));mediaTarget.addEventListener('blur',()=>mediaEvent('hide'));mediaTarget.addEventListener('click',()=>mediaEvent('show',true));
const cards=[...document.querySelectorAll('[data-model-part] .model-copy')];
cards.forEach(card=>{card.dataset.stationId=card.parentElement.id;card.dataset.feature=card.parentElement.dataset.feature||'0';});
const cardHomes=cards.map(card=>card.parentElement);let orbiting=false;
function syncCardHomes(){const next=!still();if(next===orbiting)return;orbiting=next;cards.forEach((card,i)=>(next?world:cardHomes[i]).append(card));}
const links=[...document.querySelectorAll('.model-chapter-nav a')];
const library=document.querySelector('#reference');
const panelOpen=()=>root.classList.contains('panel-open');
let controller=null,loading=false,failed=false,suspended=false,frame=0,dirty=true,current=null,destination,lastTime=0;
let px=0,py=0,energy=0,lastRoute=0,activeTip=0;
const groupCount=cards.length===10?5:8;
const tipStops=[.10,.20,.30,.40,.74,.83,.92,1];
const still=()=>reduced.matches||root.classList.contains('motion-off');
const enabled=()=>!document.hidden&&!suspended&&!still()&&!panelOpen()&&!navigator.connection?.saveData;
function layout(){
 const r=story.getBoundingClientRect();
 destination=composeJourney({width:innerWidth,height:innerHeight,hero:anchor.getBoundingClientRect(),story:r,scroll:scrollY,still:still(),reading:library?.open});
 if(cards.length>4){const t=Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));destination.progress=t*(cards.length-1);const card=cards[Math.round(destination.progress)];destination.part=card.dataset.stationId||'';const near=tipStops.findIndex(stop=>Math.abs(stop-t)<.035);if(near>=0)activeTip=cards.length===10?[0,1,1,2,2,3,3,4][near]:near;destination.pose.flight=t;destination.pose.feature=Number(card.dataset.feature||0);destination.pose.zoom=1;destination.pose.fx=destination.pose.fy=destination.pose.fz=0;}
 destination.entry=Math.min(1,Math.max(0,(innerHeight*.85-r.top)/(innerHeight*.55)));
 destination.exit=Math.min(1,Math.max(0,(r.top+r.height-innerHeight*.1)/(innerHeight*.4)));
 root.dataset.modelZone=destination.inStory?'story':'page';
 for(const link of links){if(destination.inStory&&link.hash==='#'+destination.part)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');}
}
function schedule(){if(!frame&&!document.hidden&&!suspended)frame=requestAnimationFrame(update);}
function pose(){if(enabled()&&controller)controller.setPose({...destination.pose,feature:root.classList.contains('atlas-open')?0:destination.pose.feature,phase:current.phase,x:destination.pose.x+py*.06,y:destination.pose.y+px*.10,energy:destination.pose.energy+energy*.15});}
function update(time){
 frame=0;if(document.hidden||suspended)return;
 syncCardHomes();
 if(dirty){layout();dirty=false;}
 if(!current)current={progress:destination.progress,opacity:destination.opacity,phase:destination.pose.phase,entry:destination.entry,exit:destination.exit};
 const dt=lastTime?Math.min(.05,(time-lastTime)/1000):1/60;lastTime=time;
 const ease=still()?1:1-Math.exp(-12*dt);let settling=false;
 for(const key of ['progress','opacity','phase','entry','exit']){
  const target=key==='phase'?destination.pose.phase:destination[key];current[key]+=(target-current[key])*ease;
  if(Math.abs(target-current[key])>.0004)settling=true;else current[key]=target;
 }
 wrap.style.opacity=String(current.opacity);
 root.style.setProperty('--orbital-light-dx',`${Math.sin(current.phase)*Math.min(100,innerWidth*.08)+px*24}px`);
 root.style.setProperty('--orbital-light-dy',`${Math.cos(current.phase)*Math.min(70,innerHeight*.06)+py*24}px`);
 root.style.setProperty('--orbital-ground-turn',`${Math.sin(current.phase)*12}deg`);
 for(let i=0;i<cards.length;i++){
  const card=cards[i];
  if(still()){
   card.style.removeProperty('transform');card.style.removeProperty('opacity');card.style.removeProperty('visibility');card.inert=false;card.removeAttribute('aria-hidden');continue;
  }
  if(controller)continue;
  const p=orbitCard(i,current.progress,innerWidth,innerHeight);
  card.style.width=p.width+'px';
  card.style.transform=`translate3d(${p.x}px,${p.y}px,${p.z}px) translate(-50%,-50%) rotateY(${p.angle}deg)`;
  card.style.opacity=String(p.opacity*current.entry*current.exit);
  card.style.visibility=p.opacity*current.entry*current.exit>.003?'visible':'hidden';
  card.inert=!(p.interactive&&destination.inStory);if(card.inert)card.setAttribute('aria-hidden','true');else card.removeAttribute('aria-hidden');
 }
 sync();if(settling)schedule();
}
// Text is a plane in the model coordinate system, projected by the real camera.
function attachText({planeBounds=null,media=null,source=null,caption='',matrix,width,feature,reveal,illumination=0,lightAngle=0}){
 if(still())return;
 const route=document.querySelector('#orbit-route');if(cards.length>4&&route)route.value=cards[Math.min(cards.length-1,Math.ceil(activeTip*cards.length/groupCount))].dataset.stationId;
 mediaTarget.hidden=!media||root.classList.contains('atlas-open')||panelOpen();
 if(media){hoveredMedia={src:'./assets/features/'+source,alt:caption};mediaTarget.style.left=media.left+'px';mediaTarget.style.top=media.top+'px';mediaTarget.style.width=(media.right-media.left)+'px';mediaTarget.style.height=(media.bottom-media.top)+'px';}
 world.style.perspective='none';if(cards.length>4&&!root.classList.contains('flight-ready'))root.classList.add('flight-ready');if(cards.length>4&&!root.classList.contains('tip-pair'))root.classList.add('tip-pair');
 cards.forEach((card,i)=>{
  const flight=destination.pose.flight;const crossing=cards.length>4&&flight>.44&&flight<.68;
  const group=Math.min(groupCount-1,Math.floor(i*groupCount/cards.length));const visible=cards.length>4?group===activeTip&&!crossing:i===feature&&destination.inStory&&reveal>.98;
  if(cards.length>4&&!visible&&card.style.visibility==='hidden')return;
  if(card.style.width!==width+'px')card.style.width=width+'px';card.style.transformOrigin='0 0';
  card.style.setProperty('--stellar-spill',String(illumination));card.style.setProperty('--stellar-angle',lightAngle+'deg');
  let offset='';if(cards.length>4&&planeBounds){const members=cards.map((_,j)=>j).filter(j=>Math.min(groupCount-1,Math.floor(j*groupCount/cards.length))===activeTip),rank=members.indexOf(i),mobile=innerWidth<800&&innerHeight>=560;const x=mobile?24:rank===0?28:innerWidth-planeBounds.width-28;const y=mobile?Math.max(174,innerHeight*.49)+rank*((innerHeight*.45-70)/2+10):Math.max(110,innerHeight*.24);offset=`translate3d(${x-planeBounds.left}px,${y-planeBounds.top}px,0) `;}card.style.transform=offset+'matrix3d('+matrix.join(',')+')';
  card.style.opacity=visible?'1':'0';card.style.visibility=visible?'visible':'hidden';
  card.inert=!visible;if(visible)card.removeAttribute('aria-hidden');else card.setAttribute('aria-hidden','true');
 });
}
async function sync(){
 if(controller){controller.setActive(enabled());pose();return;}
 if(!enabled()||loading||failed)return;loading=true;
 try{const {createEmblem}=await import('./nova-emblem.js?v=18');if(!enabled())return;controller=createEmblem(canvas,{onFrame:attachText});controller.setActive(true);pose();}
 catch(error){failed=true;wrap.classList.remove('webgl-ready');console.warn('Nova 3D unavailable; using the transparent emblem.',error);}
 finally{loading=false;}
}
function relayout(){dirty=true;schedule();}
addEventListener('scroll',relayout,{passive:true});addEventListener('resize',relayout,{passive:true});
if(typeof ResizeObserver==='function'){const resize=new ResizeObserver(relayout);resize.observe(story);resize.observe(anchor);}
document.fonts?.ready.then(relayout);
library?.addEventListener('toggle',relayout);
// Deep links into the detailed reference must remain usable while it is collapsed.
function revealReference(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(!id)return;const target=document.getElementById(id);if(target&&library?.contains(target)){library.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}}
addEventListener('hashchange',revealReference);revealReference();
document.addEventListener('pointermove',event=>{if(!enabled()||!fine.matches||event.pointerType==='touch')return;
 const x=event.clientX/Math.max(1,innerWidth)-.5,y=event.clientY/Math.max(1,innerHeight)-.5;
 if(Math.abs(x-px)+Math.abs(y-py)<.002)return;px=x;py=y;schedule();},{passive:true});
document.addEventListener('pointerleave',()=>{px=py=energy=0;if(enabled())schedule();});
for(const[type,value]of[['pointerover',1],['pointerout',0]])document.addEventListener(type,event=>{const t=event.target.closest('a,button,summary');if(!t||t.contains(event.relatedTarget)||!enabled()||energy===value)return;energy=value;schedule();},{passive:true});
document.addEventListener('orbitpanelchange',()=>{controller?.setActive(enabled());relayout();});
function preferences(){if(still())px=py=energy=0;controller?.setActive(enabled());relayout();}
reduced.addEventListener('change',preferences);navigator.connection?.addEventListener('change',preferences);
new MutationObserver(preferences).observe(root,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;controller?.setActive(false);}else{lastTime=0;relayout();}});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;controller?.dispose();controller=null;wrap.classList.remove('webgl-ready');});
addEventListener('pagehide',()=>{suspended=true;cancelAnimationFrame(frame);frame=0;controller?.setActive(false);});
addEventListener('pageshow',()=>{suspended=false;lastTime=0;preferences();});
layout();schedule();
