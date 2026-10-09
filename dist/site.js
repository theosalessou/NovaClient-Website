const screens = [
{id:'menu',name:'Menu',title:'Main menu',description:'Main menu with access to servers, demos, the editor and settings.',alt:'NovaClient main menu'},
{id:'kog',name:'KoG',title:'KoG profile statistics',description:'Player points, ranking and completed maps.',alt:'KoG profile for yTheo showing points, ranking and completed maps'},
{id:'map-tries',name:'Map Tries',title:'Attempts per map',description:'Total attempts for each map, across servers and sessions.',alt:'Map Tries attempt counts by map'},
{id:'history',name:'History',title:'Session history',description:'Per-server visits, saves, lasts, deaths and online time.',alt:'NovaClient session history showing per-server statistics'},
{id:'maps',name:'Completed maps',title:'Completed maps',description:'Completed maps with difficulty filters, search and best times.',alt:'Completed KoG maps with times and difficulty filters'},
{id:'finish',name:'Finish cards',title:'Finish cards',description:'Map name, completion time, freezes, saves and lasts saved in a finish card.',alt:'NovaClient finish card preview for Kobra 2'},
{id:'smooth',name:'Smoothing',title:'Player smoothing settings',description:'Separate smoothing settings for sessions with and without AntiPing.',alt:'Player smoothing options with and without AntiPing'},
{id:'minimap',name:'Minimap',title:'Minimap settings',description:'Minimap HUD, death markers and the keyboard shortcut for the full map.',alt:'Minimap settings with minimap HUD and death markers enabled'},
{id:'full-map',name:'Full map',title:'Full-map view',description:'Full-size map with your position and death markers.',alt:'Full-map explorer showing the map layout, player position and death markers'}
];
let activeScreen=0;
const tabs=[...document.querySelectorAll('[data-screen]')];
const lightbox=document.querySelector('#lightbox');
const command=document.querySelector('#command-dialog');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function selectScreen(index,focus=false){
 activeScreen=(index+screens.length)%screens.length;const screen=screens[activeScreen];
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===activeScreen));tab.tabIndex=i===activeScreen?0:-1;});
 document.querySelector('#screen-panel').setAttribute('aria-labelledby','tab-'+screen.id);
 const image=document.querySelector('#screen-image');image.src='assets/'+screen.id+'.png';image.alt=screen.alt;image.removeAttribute('width');image.removeAttribute('height');
 image.style.animation='none';requestAnimationFrame(()=>image.style.animation='');
 document.querySelector('#screen-path').textContent='novaclient / '+screen.id;
 document.querySelector('#screen-title').textContent=screen.title;document.querySelector('#screen-description').textContent=screen.description;
 const count=String(activeScreen+1).padStart(2,'0')+' / '+String(screens.length).padStart(2,'0');document.querySelector('#screen-count').textContent=count;document.querySelector('#lightbox-count').textContent=count;
 document.querySelector('#lightbox-title').textContent=screen.name;const fullImage=document.querySelector('#lightbox-image');fullImage.src=image.src;fullImage.alt=image.alt;
 if(focus){tabs[activeScreen].focus({preventScroll:true});tabs[activeScreen].scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'nearest',inline:'nearest'});}
}
tabs.forEach((tab,i)=>{
 tab.addEventListener('click',()=>selectScreen(i));
 tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=activeScreen+1;else if(event.key==='ArrowLeft')next=activeScreen-1;else if(event.key==='Home')next=0;else if(event.key==='End')next=screens.length-1;if(next!==undefined){event.preventDefault();selectScreen(next,true);}});
});
document.querySelector('#screen-prev').addEventListener('click',()=>selectScreen(activeScreen-1));
document.querySelector('#screen-next').addEventListener('click',()=>selectScreen(activeScreen+1));
document.querySelectorAll('[data-jump-screen]').forEach(button=>button.addEventListener('click',()=>{selectScreen(screens.findIndex(screen=>screen.id===button.dataset.jumpScreen));document.querySelector('#client').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});}));
function openDialog(dialog){dialog.showModal();document.body.classList.add('modal-open');}
document.querySelector('#expand-screen').addEventListener('click',()=>openDialog(lightbox));
document.querySelector('#screen-zoom').addEventListener('click',()=>openDialog(lightbox));
document.querySelector('#lightbox-prev').addEventListener('click',()=>selectScreen(activeScreen-1));
document.querySelector('#lightbox-next').addEventListener('click',()=>selectScreen(activeScreen+1));
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
 dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
});
function openCommand(){openDialog(command);document.querySelector('#command-search').focus();}
document.querySelector('#open-command').addEventListener('click',openCommand);
document.querySelectorAll('[data-destination]').forEach(button=>button.addEventListener('click',()=>{command.close();document.querySelector(button.dataset.destination).scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});}));
document.querySelector('#command-search').addEventListener('input',event=>{
 const value=event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();let visible=0;
 document.querySelectorAll('[data-destination]').forEach(button=>{button.hidden=!button.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(value);if(!button.hidden)visible++;});
 document.querySelector('.command-empty').hidden=visible!==0;
});
document.querySelector('#command-search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();document.querySelector('[data-destination]:not([hidden])')?.click();}if(event.key==='ArrowDown'){event.preventDefault();document.querySelector('[data-destination]:not([hidden])')?.focus();}});
let effects=!reducedMotion.matches;
try{const preference=localStorage.getItem('nova-effects');if(preference!==null)effects=preference==='on'&&!reducedMotion.matches;}catch{}
const effectsButton=document.querySelector('#effects-button');
function setEffects(enabled){
 effects=enabled;document.documentElement.classList.toggle('effects-off',!enabled);effectsButton.setAttribute('aria-pressed',String(enabled));effectsButton.querySelector('span').textContent=enabled?'Effects enabled':'Effects disabled';
 try{localStorage.setItem('nova-effects',enabled?'on':'off');}catch{}
 if(enabled)startSpace();else stopSpace();
}
effectsButton.addEventListener('click',()=>setEffects(!effects));
document.addEventListener('keydown',event=>{
 const editing=/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)||event.target.isContentEditable;
 if(event.key==='F6'){event.preventDefault();setEffects(!effects);}
 else if(event.key==='/'&&!editing&&!lightbox.open&&!command.open){event.preventDefault();openCommand();}
 else if(lightbox.open&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();selectScreen(activeScreen+(event.key==='ArrowRight'?1:-1));}
});
document.querySelectorAll('.feature-detail').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.feature-detail').forEach(other=>{if(other!==detail)other.open=false;});}));
const navObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('.nav-link').forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id));});},{rootMargin:'-15% 0px -65% 0px'});
document.querySelectorAll('main>section').forEach(section=>navObserver.observe(section));
function updateProgress(){const height=document.documentElement.scrollHeight-innerHeight;document.querySelector('.scroll-progress').style.transform='scaleX('+(height?scrollY/height:0)+')';}
addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress);
let toastTimer;
function toast(message){const element=document.querySelector('#toast');element.textContent=message;element.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove('show'),2600);}
document.querySelector('#copy-download').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('[data-download]').href);toast('Download link copied.');}catch{toast('Unable to copy the link. Use the download button.');}});
fetch('https://api.github.com/repos/theosalessou/NovaClient-Dist/releases?per_page=6',{signal:AbortSignal.timeout(6000)})
.then(response=>{if(!response.ok)throw new Error('Unavailable');return response.json();})
.then(releases=>{
 const available=releases.filter(release=>!release.draft&&release.assets?.some(asset=>/^NovaClient-.*-win64\.zip$/.test(asset.name)));if(!available.length)return;
 const current=available[0],asset=current.assets.find(asset=>/^NovaClient-.*-win64\.zip$/.test(asset.name));
 if(!asset.browser_download_url.startsWith('https://github.com/theosalessou/NovaClient-Dist/releases/download/'))return;
 document.querySelectorAll('[data-download]').forEach(link=>link.href=asset.browser_download_url);document.querySelectorAll('[data-version]').forEach(label=>label.textContent=current.tag_name);
 const list=document.querySelector('#release-list');list.replaceChildren();
 available.slice(0,3).forEach((release,i)=>{
  if(!release.html_url.startsWith('https://github.com/theosalessou/NovaClient-Dist/releases/tag/'))return;
  const link=document.createElement('a');link.className='release-item';link.href=release.html_url;link.target='_blank';link.rel='noopener noreferrer';
  const version=document.createElement('span');version.className='release-tag';version.textContent=release.tag_name;
  const description=document.createElement('span');description.className='release-summary';description.textContent=release.tag_name==='2.1.0-beta.38'?'11 input prediction modes, configurable per-mode options and Meow hook/projectile fixes.':release.tag_name==='2.1.0-beta.37'?'Aspect ratio presets and custom ratios, with game-view and full-screen apply options.':release.tag_name==='2.1.0-beta.36'?'Added the TClient-style Reduced Visual Delay option for Fast Input.':new Date(release.published_at).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'});
  const label=document.createElement('span');label.className='release-label';label.textContent=i===0?'LATEST':'VIEW RELEASE';link.append(version,description,label);list.append(link);
 });
}).catch(()=>{});
// A small star field paused when the hero is outside the viewport.
const canvas=document.querySelector('#space'),ctx=canvas.getContext('2d'),hero=document.querySelector('.hero');
let width=0,height=0,particles=[],spaceFrame=0,inHero=true,pointer={x:.5,y:.5},smoothedPointer={x:.5,y:.5};
function resizeSpace(){
 width=hero.clientWidth;height=hero.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx?.setTransform(ratio,0,0,ratio,0,0);
 particles=Array.from({length:Math.min(85,Math.floor(width/14))},()=>({x:Math.random()*width,y:Math.random()*height,r:.5+Math.random()*1.2,speed:.1+Math.random()*.22,alpha:.1+Math.random()*.4,depth:8+Math.random()*20}));
}
function drawSpace(){
 spaceFrame=0;if(!effects||!inHero||document.hidden||!ctx)return;ctx.clearRect(0,0,width,height);smoothedPointer.x+=(pointer.x-smoothedPointer.x)*.025;smoothedPointer.y+=(pointer.y-smoothedPointer.y)*.025;
 particles.forEach(particle=>{particle.y-=particle.speed;if(particle.y<-20)particle.y=height+20;const x=particle.x+(smoothedPointer.x-.5)*particle.depth,y=particle.y+(smoothedPointer.y-.5)*particle.depth;ctx.fillStyle='rgba(204,169,255,'+particle.alpha+')';ctx.beginPath();ctx.arc(x,y,particle.r,0,Math.PI*2);ctx.fill();});
 spaceFrame=requestAnimationFrame(drawSpace);
}
function startSpace(){if(!spaceFrame&&effects&&inHero&&!document.hidden&&ctx)spaceFrame=requestAnimationFrame(drawSpace);}
function stopSpace(){cancelAnimationFrame(spaceFrame);spaceFrame=0;}
hero.addEventListener('pointermove',event=>{const rect=hero.getBoundingClientRect();pointer={x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height};},{passive:true});
hero.addEventListener('pointerleave',()=>pointer={x:.5,y:.5});addEventListener('resize',resizeSpace);
new IntersectionObserver(entries=>{inHero=entries[0].isIntersecting;if(inHero)startSpace();else stopSpace();}).observe(hero);
document.addEventListener('visibilitychange',()=>document.hidden?stopSpace():startSpace());
reducedMotion.addEventListener('change',event=>{if(event.matches)setEffects(false);});
resizeSpace();setEffects(effects);updateProgress();

