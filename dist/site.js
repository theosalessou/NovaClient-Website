'use strict';
const screens=[
{id:'menu',title:'Main menu',category:'interface',description:'Open the server browser, demos, map editor or settings.'},
{id:'kog',title:'KoG profile',category:'stats',description:'Player points, ranking and completed maps.'},
{id:'map-tries',title:'Map Tries',category:'stats',description:'Attempts per map, across servers and sessions.'},
{id:'history',title:'Session history',category:'stats',description:'Per-server visits, saves, lasts, deaths and online time.'},
{id:'maps',title:'Completed maps',category:'stats',description:'Completed KoG maps with difficulty filters, search and best times.'},
{id:'finish',title:'Finish cards',category:'stats',description:'Map name, completion time, freezes, saves and lasts saved at the finish.'},
{id:'smooth',title:'AntiPing smoothing',category:'gameplay',description:'Smooths prediction corrections, with less visual delay near collisions and hooks. Requires AntiPing player prediction.'},
{id:'minimap',title:'Minimap',category:'interface',description:'Minimap HUD, death markers and a shortcut to the full map.'},
{id:'full-map',title:'Full-map explorer',category:'gameplay',description:'Full-size map with your position and death markers.'},
{id:'client',title:'Server browser',category:'interface',description:'Browse servers by ping and player count, or open your friends and favorites.'}
];
const $=selector=>document.querySelector(selector);
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const storage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}};
let motion=!motionQuery.matches&&storage.get('nova-motion')!=='off';let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
let filter='all';
function renderGallery(){
 const query=$('#feature-search').value.trim().toLocaleLowerCase();
 const results=screens.filter(screen=>screen.id!=='client'&&(filter==='all'||screen.category===filter)&&(screen.title+' '+screen.description).toLocaleLowerCase().includes(query));
 $('#gallery').replaceChildren(...results.map(screen=>{
  const button=document.createElement('button');button.className='gallery-card';button.dataset.openScreen=screen.id;
  const frame=document.createElement('div');frame.className='gallery-image';const image=document.createElement('img');image.src='assets/'+screen.id+'.png';image.alt=screen.title;image.loading='lazy';image.width=1919;image.height=1079;frame.append(image);
  const caption=document.createElement('span');caption.className='gallery-caption';const name=document.createElement('span');name.textContent=screen.title;const category=document.createElement('small');category.textContent={stats:'Statistics',gameplay:'Gameplay',interface:'Interface'}[screen.category];name.append(category);const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');caption.append(name,arrow);button.append(frame,caption);return button;
 }));
 $('#result-count').textContent=results.length+' '+(results.length===1?'feature':'features')+' found';$('#no-results').hidden=results.length!==0;
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderGallery();}));
$('#feature-search').addEventListener('input',renderGallery);
$('#clear-search').addEventListener('click',()=>{$('#feature-search').value='';filter='all';document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.filter==='all')));renderGallery();});renderGallery();
const dialog=$('#screen-dialog');let currentScreen=0,dialogOpener;
function updateDialog(){const screen=screens[currentScreen];$('#dialog-image').src='assets/'+screen.id+'.png';$('#dialog-image').alt=screen.title;$('#dialog-title').textContent=screen.title;$('#dialog-description').textContent=screen.description;$('#dialog-count').textContent=(currentScreen+1)+' / '+screens.length;}
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-open-screen]');if(!trigger)return;const index=screens.findIndex(screen=>screen.id===trigger.dataset.openScreen);if(index<0)return;currentScreen=index;dialogOpener=trigger;updateDialog();dialog.showModal();document.body.style.overflow='hidden';});
function changeScreen(delta){currentScreen=(currentScreen+delta+screens.length)%screens.length;updateDialog();}
$('#close-dialog').addEventListener('click',()=>dialog.close());$('#dialog-prev').addEventListener('click',()=>changeScreen(-1));$('#dialog-next').addEventListener('click',()=>changeScreen(1));dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{document.body.style.overflow='';dialogOpener?.focus();});dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();changeScreen(-1);}if(event.key==='ArrowRight'){event.preventDefault();changeScreen(1);}});
const progressTabs=[...document.querySelectorAll('[data-progress]')];
function selectProgress(tab,focus=false){const screen=screens.find(item=>item.id===tab.dataset.progress);progressTabs.forEach(item=>{item.setAttribute('aria-selected',String(item===tab));item.tabIndex=item===tab?0:-1;});$('#progress-panel').setAttribute('aria-labelledby',tab.id);$('#progress-image').src='assets/'+screen.id+'.png';$('#progress-image').alt=screen.title;$('#progress-description').textContent=screen.description;$('#open-progress').dataset.openScreen=screen.id;if(focus)tab.focus();}
progressTabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectProgress(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%progressTabs.length;if(event.key==='ArrowLeft')next=(index-1+progressTabs.length)%progressTabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=progressTabs.length-1;if(next!==undefined){event.preventDefault();selectProgress(progressTabs[next],true);}});});
$('#input-mode').addEventListener('change',event=>{$('#mode-description').textContent=event.target.value+' — adjust the prediction amount and whether it applies to other players in Nova settings.';});
const stage=$('#lab-stage');const widgets=[...document.querySelectorAll('.hud-panel')];let scale=1;
const widgetControls={'map-widget':'hud-minimap','stats-widget':'hud-stats','finish-widget':'hud-finish'};
function clampWidget(widget,x,y){const maxX=Math.max(8,stage.clientWidth-widget.offsetWidth*scale-8),maxY=Math.max(48,stage.clientHeight-widget.offsetHeight*scale-42);widget.style.left=Math.max(8,Math.min(x,maxX))+'px';widget.style.top=Math.max(48,Math.min(y,maxY))+'px';widget.style.right='auto';}
widgets.forEach(widget=>{
 let drag;
 widget.addEventListener('pointerdown',event=>{if(event.button!==0)return;const bounds=widget.getBoundingClientRect(),area=stage.getBoundingClientRect();drag={x:event.clientX-bounds.left,y:event.clientY-bounds.top};clampWidget(widget,bounds.left-area.left-1,bounds.top-area.top-1);widget.setPointerCapture(event.pointerId);widget.focus({preventScroll:true});});
 widget.addEventListener('pointermove',event=>{if(!drag)return;const bounds=stage.getBoundingClientRect();clampWidget(widget,event.clientX-bounds.left-drag.x,event.clientY-bounds.top-drag.y);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>widget.addEventListener(type,()=>{drag=null;}));
 widget.addEventListener('keydown',event=>{const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[event.key];if(!delta)return;event.preventDefault();clampWidget(widget,widget.offsetLeft+delta[0],widget.offsetTop+delta[1]);});
});
function syncHud(){scale=Number($('#hud-scale').value)/100;$('#scale-value').textContent=Math.round(scale*100)+'%';widgets.forEach(widget=>{widget.hidden=!$('#'+widgetControls[widget.id]).checked;widget.style.transform='scale('+scale+')';if(!widget.hidden)clampWidget(widget,widget.offsetLeft,widget.offsetTop);});}
['hud-minimap','hud-stats','hud-finish','hud-scale'].forEach(id=>$('#'+id).addEventListener('input',syncHud));
function resetHud(){['hud-minimap','hud-stats'].forEach(id=>$('#'+id).checked=true);$('#hud-finish').checked=false;$('#hud-scale').value='100';widgets.forEach(widget=>{widget.style.left='';widget.style.top='';widget.style.right='';});syncHud();}
$('#reset-hud').addEventListener('click',()=>{resetHud();toast('HUD layout reset.');});
$('#save-hud').addEventListener('click',()=>{const layout={scale:$('#hud-scale').value,widgets:widgets.map(widget=>({id:widget.id,visible:!widget.hidden,x:widget.offsetLeft,y:widget.offsetTop}))};toast(storage.set('nova-hud-demo',JSON.stringify(layout))?'Demo layout saved in this browser.':'This browser could not save the demo layout.');});
try{const saved=JSON.parse(storage.get('nova-hud-demo'));if(saved&&Array.isArray(saved.widgets)){if(Number.isFinite(Number(saved.scale)))$('#hud-scale').value=String(Math.max(75,Math.min(120,Number(saved.scale))));saved.widgets.forEach(item=>{if(!Object.hasOwn(widgetControls,item.id))return;$('#'+widgetControls[item.id]).checked=!!item.visible;if(Number.isFinite(item.x)&&Number.isFinite(item.y))clampWidget($('#'+item.id),item.x,item.y);});}}catch{}
syncHud();
const canvas=$('#run-canvas'),ctx=canvas.getContext('2d');let animation=0,lastTime=0,elapsed=0,visible=false,paused=false;
function resizeCanvas(){const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(stage.clientWidth*ratio);canvas.height=Math.round(stage.clientHeight*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);paint();}
function paint(){if(!ctx)return;const w=stage.clientWidth,h=stage.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='#282030';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#47354f';ctx.lineWidth=1;for(let x=0;x<w;x+=38){ctx.beginPath();ctx.moveTo(x,45);ctx.lineTo(x,h);ctx.stroke();}for(let y=45;y<h;y+=38){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.fillStyle='#51395e';ctx.fillRect(0,h-82,w,34);ctx.fillStyle='#785689';ctx.fillRect(0,h-82,w,3);const phase=elapsed*.00045,x=w*.5+Math.sin(phase)*w*.22,y=h-111-Math.abs(Math.cos(phase))*55,hookX=w*.62,hookY=h*.36;ctx.strokeStyle='#c49ce4';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(hookX,hookY);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#b783da';ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eadff2';ctx.beginPath();ctx.ellipse(x+4,y-2,3,5,0,0,7);ctx.ellipse(x+10,y-2,3,5,0,0,7);ctx.fill();ctx.fillStyle='#2c1937';ctx.beginPath();ctx.arc(x+5,y-1,1.4,0,7);ctx.arc(x+11,y-1,1.4,0,7);ctx.fill();ctx.fillStyle='#9270ab';ctx.beginPath();ctx.ellipse(x-10,y+13,8,4,-.2,0,7);ctx.ellipse(x+11,y+13,8,4,.2,0,7);ctx.fill();ctx.fillStyle='#dec6f0';ctx.beginPath();ctx.arc(hookX,hookY,3,0,7);ctx.fill();}
function tick(time){animation=0;if(!motion||!visible||paused||document.hidden){lastTime=0;return;}if(lastTime)elapsed+=Math.min(time-lastTime,50);lastTime=time;paint();animation=requestAnimationFrame(tick);}
function start(){if(!animation&&motion&&visible&&!paused&&!document.hidden)animation=requestAnimationFrame(tick);}
function stop(){cancelAnimationFrame(animation);animation=0;lastTime=0;}
new ResizeObserver(()=>{widgets.forEach(widget=>{if(!widget.hidden)clampWidget(widget,widget.offsetLeft,widget.offsetTop);});resizeCanvas();}).observe(stage);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();},{threshold:.05}).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
$('#pause-demo').addEventListener('click',()=>{paused=!paused;$('#pause-demo').setAttribute('aria-pressed',String(paused));$('#pause-demo').textContent=paused?'Resume demo':'Pause demo';if(paused)stop();else start();});
function syncMotion(){document.documentElement.classList.toggle('motion-off',!motion);$('#motion-toggle').setAttribute('aria-pressed',String(motion));$('#motion-toggle').textContent=motion?'Motion on':'Motion off';if(motion)start();else{stop();document.querySelectorAll('.tilt-surface').forEach(element=>element.style.transform='');}}
$('#motion-toggle').addEventListener('click',()=>{motion=!motion;storage.set('nova-motion',motion?'on':'off');syncMotion();});motionQuery.addEventListener('change',event=>{motion=!event.matches&&storage.get('nova-motion')!=='off';syncMotion();});
document.querySelectorAll('.tilt-surface').forEach(element=>{let frame=0;const base=element.classList.contains('game-frame')?-5:8;element.addEventListener('pointermove',event=>{if(!motion||event.pointerType==='touch')return;const box=element.getBoundingClientRect(),x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{element.style.transform='rotate('+base+'deg) rotateX('+(-y*6)+'deg) rotateY('+(x*8)+'deg)';});});element.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);element.style.transform='';});});resizeCanvas();syncMotion();
$('#copy-download').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('[data-download]').href);toast('Download link copied.');}catch{toast('Could not copy. Use the download button to open the link.');}});
const releaseOrigin='https://github.com/theosalessou/NovaClient-Dist/releases/';
fetch('https://api.github.com/repos/theosalessou/NovaClient-Dist/releases?per_page=6',{signal:AbortSignal.timeout(6000)}).then(response=>{if(!response.ok)throw new Error('Release lookup failed');return response.json();}).then(releases=>{
 if(!Array.isArray(releases))throw new Error('Invalid release list');
 const validAsset=asset=>/^NovaClient-.*-win64\.zip$/.test(asset.name)&&asset.browser_download_url?.startsWith(releaseOrigin+'download/');
 const available=releases.filter(release=>!release.draft&&typeof release.html_url==='string'&&release.html_url.startsWith(releaseOrigin+'tag/')&&Array.isArray(release.assets)&&release.assets.some(validAsset));if(!available.length)throw new Error('No package found');available.sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));
 const latest=available[0],asset=latest.assets.find(validAsset);$('[data-download]').href=asset.browser_download_url;document.querySelectorAll('[data-version]').forEach(element=>element.textContent=latest.tag_name);
 $('#release-list').replaceChildren(...available.slice(0,3).map((release,index)=>{const link=document.createElement('a');link.className='release-row';link.href=release.html_url;const tag=document.createElement('span');tag.textContent=release.tag_name;const description=document.createElement('span');const date=new Date(release.published_at);description.textContent=(index===0?'Latest release':'Previous release')+(Number.isFinite(date.getTime())?' · '+new Intl.DateTimeFormat('en',{dateStyle:'medium'}).format(date):'');const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');link.append(tag,description,arrow);return link;}));$('#release-status').textContent='Up to date with GitHub releases.';
}).catch(()=>{$('#release-status').textContent='Couldn\'t check for updates. You can use the download above or check releases on GitHub.';});

// Pointer lights have no idle animation loop.
const heroLight=document.querySelector('.hero');let lightFrame=0;
heroLight.addEventListener('pointermove',event=>{if(!motion||event.pointerType==='touch')return;const box=heroLight.getBoundingClientRect(),x=(event.clientX-box.left)/box.width*100,y=(event.clientY-box.top)/box.height*100;cancelAnimationFrame(lightFrame);lightFrame=requestAnimationFrame(()=>{heroLight.style.setProperty('--beam-x',x+'%');heroLight.style.setProperty('--beam-y',y+'%');});});
heroLight.addEventListener('pointerleave',()=>{cancelAnimationFrame(lightFrame);heroLight.style.removeProperty('--beam-x');heroLight.style.removeProperty('--beam-y');});
let spotFrame=0;
document.querySelector('#gallery').addEventListener('pointermove',event=>{if(!motion||event.pointerType==='touch')return;const card=event.target.closest('.gallery-image');if(!card)return;const box=card.getBoundingClientRect(),x=(event.clientX-box.left)/box.width*100,y=(event.clientY-box.top)/box.height*100;cancelAnimationFrame(spotFrame);spotFrame=requestAnimationFrame(()=>{card.style.setProperty('--spot-x',x+'%');card.style.setProperty('--spot-y',y+'%');});});
new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('fx-visible',entry.isIntersecting)),{threshold:.05}).observe(document.querySelector('.hero-scene'));
document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('page-hidden',document.hidden));
