'use strict';

// Extends the existing analytics dashboard; credentials stay in session memory.
Object.assign(viewCopy, {
 network:['Server & network','The infrastructure behind Nova.','Connections, services, and host resources, in one place.'],
 kog:['KoG profiles','Fetch once. Synchronize across Nova.','Official profiles are fetched on the server and distributed to compatible clients.'],
 titles:['Title studio','A title worth making your own.','Create, style, and assign titles through the signed catalog.'],
 audit:['Activity log','Every operation, recorded.','Review administrative changes and their targets.']
});
Object.assign(labels,{queued:'Queued',running:'Running',done:'Completed',failed:'Failed'});
widgets.operations='Operations';
widgetSubtitles.operations='Server-managed titles and KoG distribution';
widgetRenderers.operations=()=>{
 const o=operations();
 return [['Custom titles',o.titles.length],['Assigned keys',new Set(o.assignments.map(a=>a.license_id)).size],['KoG jobs pending',o.jobs.filter(j=>['queued','running'].includes(j.state)).length],['Recent distributions',o.broadcasts.length]].map(([label,value])=>`<div class="ops-stat"><span>${label}</span><strong>${num(value)}</strong></div>`).join('')+'<button class="panel-link" data-view="titles">Open title studio →</button>';
};
preferences.accent='violet';
applyPreferences();renderToggles();

const chartWindows={activity:[0,1],cohorts:[0,1]};
const chartLengths={};
let networkData=null,networkLoadedAt=0,networkBusy=false,networkController=null;
let mutationBusy=false,toastTimer,confirmResolve=null,pan=null,touchPanel=null,titleEditorRevision=0;
const opLabels={'title.save':'Title saved','title.assign':'Title assignment','license.role':'Role changed','license.revoke':'Key blocked','license.restore':'Key restored','client.disconnect':'Client disconnect queued','kog.fetch':'KoG lookup queued','kog.broadcast':'KoG profile published','network.disconnect':'TCP connection closed','network.block':'IP blocked','network.unblock':'IP unblocked','service.restart':'Service restart requested'};
const operations=()=>snapshot?.operations||{titles:[],assignments:[],jobs:[],broadcasts:[],audit:[]};
const hex=color=>'#'+(Number(color)>>>0).toString(16).padStart(6,'0').slice(-6);
const bytes=value=>value>=1073741824?num(value/1073741824)+' GiB':num(value/1048576)+' MiB';
const options=(items,key,label)=>items.map(item=>`<option value="${esc(item[key])}">${esc(label(item))}</option>`).join('');

function toast(message,error=false){
 clearTimeout(toastTimer);const box=$('operation-toast');box.textContent=message;box.classList.toggle('error',error);box.hidden=false;
 toastTimer=setTimeout(()=>box.hidden=true,error?10000:6500);
}
function confirmOperation(title,message){
 if(confirmResolve)return Promise.resolve(false);
 $('confirm-title').textContent=title;$('confirm-message').textContent=message;$('operation-confirm').returnValue='cancel';$('operation-confirm').showModal();
 return new Promise(resolve=>{confirmResolve=resolve;});
}
$('operation-confirm').addEventListener('close',()=>{const resolve=confirmResolve;confirmResolve=null;resolve?.($('operation-confirm').returnValue==='confirm');});

async function adminRequest(path,body){
 const run=generation,auth=token;if(!auth)throw Error('Sign in to continue.');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),body?.action==='vm.exec'?75000:25000);
 try{
  const response=await fetch(apiUrl(path),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+auth,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});
  const data=await response.json();if(run!==generation)throw Error('Session ended.');
  if(response.status===401){logout('Your admin session is no longer authorized.');throw Error('Sign in again.');}
  if(!response.ok||data.ok===false)throw Error(data.error||'Operation failed (HTTP '+response.status+').');return data;
 }finally{clearTimeout(timeout);}
}
async function operate(body,button){
 if(mutationBusy){toast('An operation is already in progress.');return null;}
 mutationBusy=true;const run=generation;if(button)button.disabled=true;
 try{
  const result=await adminRequest('admin/action',body);if(run!==generation)return null;
  toast(result.message||'Change saved. Compatible clients receive updates automatically.');
  await refresh(true);
  if(run!==generation||!token)return null;
  if(body.action.startsWith('network.')||body.action==='service.restart'){networkLoadedAt=0;if(view==='network')await loadNetwork(true);}
  if(run!==generation||!token)return null;
  return result;
 }catch(error){if(run===generation)toast(error.name==='AbortError'?'The request timed out. Refresh before retrying.':error.message,true);return null;}
 finally{mutationBusy=false;if(button?.isConnected)button.disabled=false;}
}

function zoomPoints(points,key){
 chartLengths[key]=points.length;
 if(points.length<3)return points;
 const [start,end]=chartWindows[key]||[0,1],first=Math.floor(start*(points.length-1)),last=Math.min(points.length,Math.max(first+2,Math.ceil(end*(points.length-1))+1));
 return points.slice(first,last);
}
function chartControls(key){
 const [start,end]=chartWindows[key],count=chartLengths[key]||0;
 return `<div class="chart-controls"><button data-chart="${key}" data-zoom="in" aria-label="Zoom in">+</button><button data-chart="${key}" data-zoom="out" aria-label="Zoom out">−</button><button data-chart="${key}" data-zoom="reset">Reset zoom</button><label>From<input aria-label="Chart start" type="range" min="0" max="1000" value="${Math.round(start*1000)}" data-chart-range="${key}" data-edge="0" ${count<3?'disabled':''}></label><label>To<input aria-label="Chart end" type="range" min="0" max="1000" value="${Math.round(end*1000)}" data-chart-range="${key}" data-edge="1" ${count<3?'disabled':''}></label></div><p class="chart-zoom-info">Scroll to zoom · Drag to pan · ${num(Math.round((end-start)*100))}% of the period</p>`;
}
function sampleReadout(p){return `<div class="sample-date"><span>Selected sample</span><strong data-readout-date>${esc(p.label)}</strong></div><div class="sample-value"><span><i class="swatch"></i>Online</span><strong data-readout-online>${num(p.value)}</strong></div><div class="sample-value"><span><i class="swatch green"></i>Playing</span><strong data-readout-playing>${num(p.secondary||0)}</strong></div>`;}
function lineChart(points){const visible=zoomPoints(points,'activity');return `<div class="zoom-chart" data-zoomchart="activity">${baseLineChart(visible)}<div class="chart-readout" aria-live="polite" aria-atomic="true">${sampleReadout(visible.at(-1))}</div>${chartControls('activity')}</div>`;}
function selectChartSample(sample){
 const chart=sample.closest('[data-zoomchart]'),readout=chart?.querySelector('.chart-readout');if(!readout)return;
 chart.querySelectorAll('.chart-sample').forEach(el=>{el.classList.toggle('selected',el===sample);el.setAttribute('tabindex',el===sample?'0':'-1');});
 readout.querySelector('[data-readout-date]').textContent=sample.dataset.date;
 readout.querySelector('[data-readout-online]').textContent=num(Number(sample.dataset.online));
 readout.querySelector('[data-readout-playing]').textContent=num(Number(sample.dataset.playing));
}
document.addEventListener('pointerover',event=>{const sample=event.target.closest('.chart-sample');if(sample&&!pan)selectChartSample(sample);});
document.addEventListener('focusin',event=>{const sample=event.target.closest('.chart-sample');if(sample)selectChartSample(sample);});
document.addEventListener('click',event=>{const sample=event.target.closest('.chart-sample');if(sample)selectChartSample(sample);});
document.addEventListener('keydown',event=>{
 const sample=event.target.closest('.chart-sample');if(!sample||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 event.preventDefault();const samples=[...sample.parentElement.querySelectorAll('.chart-sample')],i=samples.indexOf(sample),next=event.key==='Home'?0:event.key==='End'?samples.length-1:Math.max(0,Math.min(samples.length-1,i+(event.key==='ArrowRight'?1:-1)));samples[next].focus();
});
function setChartWindow(key,start,end){
 const min=Math.min(1,Math.max(.02,2/Math.max(2,chartLengths[key]||2))),size=Math.min(1,Math.max(min,end-start));
 start=Math.max(0,Math.min(1-size,start));chartWindows[key]=[start,start+size];
 if(snapshot&&view==='overview')renderOverview();
}
function zoomChart(key,factor,at=.5){
 const [start,end]=chartWindows[key],size=end-start,center=start+size*at,newSize=Math.min(1,size*factor);
 setChartWindow(key,center-newSize*at,center+newSize*(1-at));
}
document.addEventListener('wheel',event=>{
 const chart=event.target.closest('[data-zoomchart]');if(!event.target.closest('svg')||!chart||!chart.querySelector('svg')||(chartLengths[chart.dataset.zoomchart]||0)<3)return;
 event.preventDefault();const rect=chart.querySelector('svg').getBoundingClientRect(),factor=Math.exp(Math.max(-.35,Math.min(.35,event.deltaY*.0015)));
 zoomChart(chart.dataset.zoomchart,factor,Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)));
},{passive:false});
document.addEventListener('change',event=>{
 const key=event.target.dataset.chartRange;if(!key)return;
 const [start,end]=chartWindows[key],value=Number(event.target.value)/1000;
 if(event.target.dataset.edge==='0')setChartWindow(key,Math.min(value,end-.02),end);else setChartWindow(key,start,Math.max(start+.02,value));
 const selector=`[data-chart-range="${key}"][data-edge="${event.target.dataset.edge}"]`;$('dashboard-grid').querySelector(selector)?.focus();
});
document.addEventListener('pointerdown',event=>{
 const chart=event.target.closest('[data-zoomchart]');
 const svg=chart&&event.target.closest('svg');
 if(svg&&event.button===0&&(chartLengths[chart.dataset.zoomchart]||0)>=3){
  pan={key:chart.dataset.zoomchart,x:event.clientX,width:svg.getBoundingClientRect().width,window:[...chartWindows[chart.dataset.zoomchart]],element:chart,svg,pointerId:event.pointerId};
  chart.classList.add('panning');svg.setPointerCapture?.(event.pointerId);event.preventDefault();
 }
 const handle=event.target.closest('[data-drag]');
 if(editing&&handle&&event.pointerType==='touch'){event.preventDefault();touchPanel={id:handle.dataset.drag,target:null};handle.closest('.panel').classList.add('dragging');}
});
document.addEventListener('pointermove',event=>{
 if(pan&&pan.pointerId===event.pointerId){const delta=event.clientX-pan.x;pan.svg.style.transform=`translateX(${delta}px)`;}
 if(touchPanel){const panel=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-widget]');document.querySelectorAll('.drag-target').forEach(p=>p.classList.remove('drag-target'));if(panel){touchPanel.target=panel.dataset.widget;panel.classList.add('drag-target');}}
});
function endPointer(event){
 if(pan&&pan.pointerId===event.pointerId){const current=pan;pan=null;current.svg.style.transform='';current.element.classList.remove('panning');const delta=(event.clientX-current.x)/current.width*(current.window[1]-current.window[0]);if(Math.abs(event.clientX-current.x)>5)setChartWindow(current.key,current.window[0]-delta,current.window[1]-delta);}
 if(touchPanel){const {id,target}=touchPanel;touchPanel=null;if(target&&target!==id){preferences.order=preferences.order.filter(v=>v!==id);preferences.order.splice(preferences.order.indexOf(target),0,id);savePreferences();}renderOverview();}
}
document.addEventListener('pointerup',endPointer);
document.addEventListener('pointercancel',event=>{if(pan&&pan.pointerId===event.pointerId){pan.svg.style.transform='';pan.element.classList.remove('panning');pan=null;}touchPanel=null;if(editing&&snapshot)renderOverview();});
$('period').addEventListener('change',()=>{chartWindows.activity=[0,1];chartWindows.cohorts=[0,1];if(snapshot)renderView();});
$('layout-preset').addEventListener('change',()=>{if(!preferences.order.includes('operations'))preferences.order.push('operations');savePreferences();if(snapshot&&view==='overview')renderOverview();});

function renderOperationsView(id){
 if(id==='network'){renderNetwork();loadNetwork();}
 if(id==='kog')renderKoG();
 if(id==='titles')renderTitles();
 if(id==='audit')renderAudit();
}
async function loadNetwork(force=false){
 if(networkBusy||!token||(!force&&Date.now()-networkLoadedAt<8000))return;
 networkBusy=true;$('refresh-network').disabled=true;const run=generation;
 try{
  const data=await adminRequest('admin/network');if(run!==generation)return;
  if(!Array.isArray(data.connections)||!Array.isArray(data.services))throw Error('Invalid server response.');
  networkData=data;networkLoadedAt=Date.now();$('network-error').textContent='';renderNetwork();
 }catch(error){if(run===generation){$('network-error').textContent=(error.name==='AbortError'?'Server request timed out.':error.message)+(networkData?' Displayed network data may be out of date.':'');networkLoadedAt=Date.now();}}
 finally{networkBusy=false;$('refresh-network').disabled=false;}
}
function renderNetwork(){
 if(!networkData){$('network-table').innerHTML=empty('Connecting to the host…','Network controls require the local administrative service.');return;}
 const h=networkData.host,used=h.memory_total-h.memory_available,disk=h.disk_total-h.disk_free;
 $('host-metrics').innerHTML=[['Load average',num(h.load[0]),`${h.cpus} logical CPUs · 1-minute average`],['Memory',num(h.memory_total?used/h.memory_total*100:0)+'%',bytes(used)+' / '+bytes(h.memory_total)],['Disk',num(h.disk_total?disk/h.disk_total*100:0)+'%',bytes(disk)+' / '+bytes(h.disk_total)],['Uptime',duration(h.uptime),num(networkData.connections.length)+' sockets observed']].map(([title,value,description])=>`<div class="host-metric"><span>${title}</span><strong>${value}</strong><small>${description}</small></div>`).join('');
 $('network-services').innerHTML=networkData.services.map(s=>`<div class="network-service"><strong>${esc(s.name)}</strong><div>${badge(s.state==='active'?'active':'failed',s.state)}<button data-service-restart="${esc(s.name)}">Restart</button></div></div>`).join('');
 const query=$('network-search').value.trim().toLowerCase(),protocol=$('network-protocol').value,state=$('network-state').value;
 const rows=networkData.connections.filter(c=>(protocol==='all'||c.protocol===protocol)&&(state==='all'||c.state===state)&&[c.local,c.remote,c.process,c.state].join(' ').toLowerCase().includes(query));
 table('network-table',['Protocol / state','Local endpoint','Remote endpoint','Process / PID','Queues','Actions'],rows.map(c=>`<tr><td>${esc(c.protocol.toUpperCase())}<small>${esc(c.state)}</small></td><td>${esc(c.local)}</td><td>${esc(c.remote)}</td><td class="wrap">${esc(c.process||'Kernel / unavailable')}</td><td>${num(c.received)} / ${num(c.sent)}<small>Receive / send bytes</small></td><td><div class="table-actions">${c.protocol==='tcp'&&['ESTAB','CLOSE-WAIT','FIN-WAIT-1','FIN-WAIT-2'].includes(c.state)?`<button data-close-connection="${esc(c.id)}" ${c.local_port===22?'disabled':''}>Close TCP</button>`:''}${c.remote_port&&c.remote_ip!=='*'?`<button data-block-ip="${esc(c.remote_ip)}" class="danger">Block IP</button>`:'—'}</div></td></tr>`),'network','connections');
 $('blocked-ips').innerHTML=networkData.blocked.length?networkData.blocked.map(ip=>`<div class="blocked-ip"><span>${esc(ip)}</span><button data-unblock-ip="${esc(ip)}">Unblock</button></div>`).join(''):empty('No IPs blocked by the dashboard.','Host firewall rules outside this dashboard are preserved.');
}
function renderKoG(){
 const o=operations();
 $('kog-broadcasts').innerHTML=o.broadcasts.length?o.broadcasts.map(b=>`<div class="list-row"><div class="list-person"><strong>${esc(b.player)}</strong><small>${datetime(b.updated_at)} · Distribution #${Number(b.id)}</small></div>${badge('done','Published')}</div>`).join(''):empty('No profiles published yet.','Fetch a player profile to synchronize it with compatible clients.');
 table('kog-jobs',['Job / player','State','Created','Last update','Result'],o.jobs.map(j=>`<tr><td>#${Number(j.id)}<small>${esc(j.player)}</small></td><td>${badge(j.state)}</td><td>${datetime(j.created_at)}</td><td>${datetime(j.updated_at)}</td><td class="wrap">${esc(j.message||'Waiting for server…')}</td></tr>`),'jobs','jobs');
}
function setOptions(id,html){const el=$(id);if(document.activeElement===el)return;const current=el.value;el.innerHTML=html;if([...el.options].some(o=>o.value===current))el.value=current;}
function renderTitles(){
 const o=operations(),query=$('title-search').value.trim().toLowerCase();
 const titles=o.titles.filter(t=>[t.id,t.name].join(' ').toLowerCase().includes(query));
 $('title-catalog').innerHTML=titles.length?titles.map(t=>`<article class="title-card ${t.enabled?'':'disabled'}"><div><strong>${esc(t.name)}</strong><small><i class="title-color-mark" data-title-style="${Number(t.id)}" aria-hidden="true"></i>#${Number(t.id)} · ${esc(t.mode)} · ${Number(t.speed)}% · ${t.enabled?'Available':'Disabled'}${t.id<55?' · Original override':''}</small></div><button data-edit-title="${Number(t.id)}">Edit</button></article>`).join(''):empty('Make the first title yours.','Create a title, choose its colors, then assign it to a key.');
 for(const el of $('title-catalog').querySelectorAll('[data-title-style]')){const title=o.titles.find(t=>t.id===Number(el.dataset.titleStyle));el.style.background=title.mode==='rgb'?'linear-gradient(90deg,hsl(0 100% 60%),hsl(60 100% 60%),hsl(120 100% 60%),hsl(180 100% 60%),hsl(240 100% 60%),hsl(300 100% 60%),hsl(360 100% 60%))':title.mode==='gradient'?`linear-gradient(90deg,${hex(title.color1)},${hex(title.color2)})`:hex(title.color1);}
 setOptions('assign-license',options(snapshot.players,'id',p=>'#'+p.id+' · '+p.label));
 setOptions('editor-license',options(snapshot.players,'id',p=>'#'+p.id+' · '+p.label));
 $('title-editors').innerHTML=(o.editors||[]).map(e=>`<div class="assignment-row"><strong>Key #${Number(e.license_id)} · ${esc(e.label)}</strong><button data-revoke-editor="${Number(e.license_id)}">Revoke editor</button></div>`).join('');
 setOptions('assign-title',options(o.titles.filter(t=>t.enabled),'id',t=>'#'+t.id+' · '+t.name));
 $('title-assignment-form').querySelector('button').disabled=!snapshot.players.length||!o.titles.some(t=>t.enabled);
 $('title-assignments').innerHTML=o.assignments.map(a=>`<div class="assignment-row"><div><strong>Key #${Number(a.license_id)} · ${esc(a.label)}</strong><small>${esc(o.titles.find(t=>t.id===a.title_id)?.name||'Unavailable title')} · #${Number(a.title_id)}</small></div><button data-unassign-title="${Number(a.license_id)}" data-unassign-id="${Number(a.title_id)}">Remove</button></div>`).join('');
}
function editTitle(title){
 titleEditorRevision++;
 $('title-id').value=title?.id??'';$('title-form-heading').textContent=title?'Edit title #'+title.id:'New title';
 $('title-name').value=title?.name||'Your title';$('title-mode').value=title?.mode||'gradient';$('title-animation').value=title?.animation||'default';$('title-color1').value=hex(title?.color1??0x8c5cc7);$('title-color2').value=hex(title?.color2??0xd9b0ec);$('title-speed').value=title?.speed||100;$('title-enabled').checked=title?Boolean(title.enabled):true;updatePreview();$('title-name').focus();
}
function previewSpec(){return {name:$('title-name').value||'Your title',mode:$('title-mode').value,animation:$('title-animation').value,color1:parseInt($('title-color1').value.slice(1),16),color2:parseInt($('title-color2').value.slice(1),16),speed:Number($('title-speed').value)};}
let previewEpoch=performance.now();
function updatePreview(){
 previewEpoch=performance.now();
 const spec=previewSpec(),text=$('title-preview').querySelector('span');text.replaceChildren();for(const char of [...spec.name]){const span=document.createElement('span');span.textContent=char;text.append(span);}
 $('title-speed-label').textContent=spec.speed+'%';$('title-color2').disabled=spec.mode==='solid'||spec.mode==='rgb';$('title-color1').disabled=spec.mode==='rgb';paintPreview(performance.now());
}
function paintPreview(now){
 const spec=previewSpec(),glyphs=$('title-preview').querySelector('span').children,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const phase=reduce?0:(now-previewEpoch)/1000*spec.speed/100;
 const rgb=color=>[(color>>16)&255,(color>>8)&255,color&255],a=rgb(spec.color1),b=rgb(spec.color2);
 [...glyphs].forEach((glyph,i)=>{const position=i/Math.max(1,glyphs.length-1),mix=reduce?position:.5+.5*Math.sin(position*Math.PI+phase*1.8);glyph.style.color=spec.mode==='rgb'?`hsl(${((i/12+phase*.22)%1)*360} 100% 60%)`:spec.mode==='solid'?hex(spec.color1):`rgb(${a.map((v,k)=>Math.round(v+(b[k]-v)*mix)).join(' ')})`;const wave=spec.animation==='wave'||spec.animation==='default'&&Number($('title-id').value)>=47&&Number($('title-id').value)<=54;glyph.style.transform=reduce||!wave?'none':`translateY(${Math.sin(phase*3-i*.5)*2.16}px)`;glyph.style.opacity=reduce||spec.animation!=='pulse'?'1':String(.75+.25*Math.sin(phase*3));});
}
let previewLast=0;
function animatePreview(now){if(view==='titles'&&snapshot&&!document.hidden&&now-previewLast>40){paintPreview(now);previewLast=now;}requestAnimationFrame(animatePreview);}
updatePreview();requestAnimationFrame(animatePreview);
function renderAudit(){table('admin-audit',['Time','Action','Target','Details'],operations().audit.map(a=>`<tr><td>${datetime(a.timestamp)}</td><td>${esc(opLabels[a.action]||a.action)}</td><td>${esc(a.target)}</td><td class="wrap">${esc(a.details||'—')}</td></tr>`),'audit','operations');}
function renderProfileActions(){
 const p=snapshot?.players.find(p=>p.id===selectedId);if(!p)return;
 $('profile-admin')?.remove();
 const section=document.createElement('section');section.id='profile-admin';section.className='profile-section';
 const assigned=operations().assignments.find(a=>a.license_id===p.id);
 section.innerHTML=`<h3>Manage key #${Number(p.id)}</h3><form id="profile-role-form"><label>Role<select id="profile-role">${['Member','Collaborator','Supporter','Owner'].map(role=>`<option ${role===p.role?'selected':''}>${role}</option>`).join('')}</select></label><button>Save role</button></form><p class="help">Titles: ${esc(operations().assignments.filter(a=>a.license_id===p.id).map(a=>operations().titles.find(t=>t.id===a.title_id)?.name||'#'+a.title_id).join(', ')||'Player selection / earned titles')}${p.kog_player?'<br>Linked KoG player: '+esc(p.kog_player):''}</p><div class="admin-actions"><button data-profile-title="${Number(p.id)}">Assign title</button><button data-disconnect-client="${Number(p.id)}" ${p.online?'':'disabled'}>Disconnect client</button><button class="${p.status==='revoked'?'':'danger'}" data-license-action="${p.status==='revoked'?'license.restore':'license.revoke'}" data-license-id="${Number(p.id)}">${p.status==='revoked'?'Restore access':'Block access'}</button></div><p class="help">Disconnect is delivered on the next signed renewal (up to 60 seconds) and requires a compatible client. Blocking access stops authorization; existing grants expire within 180 seconds.</p>`;
 $('profile-content').append(section);
}

for(const id of ['network-search','network-protocol','network-state'])$(id).addEventListener(id.endsWith('search')?'input':'change',()=>{pages.network=1;renderNetwork();});
$('refresh-network').addEventListener('click',()=>loadNetwork(true));
$('title-editor-form').addEventListener('submit',async event=>{event.preventDefault();await operate({action:'title.editor',license_id:Number($('editor-license').value),enabled:true},event.submitter)});
$('title-search').addEventListener('input',renderTitles);
for(const id of ['title-name','title-mode','title-animation','title-color1','title-color2','title-speed'])$(id).addEventListener('input',updatePreview);
$('new-title').addEventListener('click',()=>editTitle(null));
$('title-form').addEventListener('submit',async event=>{event.preventDefault();const spec=previewSpec(),id=$('title-id').value,revision=titleEditorRevision;const result=await operate({action:'title.save',id:id===''?null:Number(id),...spec,enabled:$('title-enabled').checked},$('title-save'));if(result&&revision===titleEditorRevision){$('title-id').value=result.id;$('title-form-heading').textContent='Edit title #'+result.id;}});
$('builtin-title-form').addEventListener('submit',event=>{event.preventDefault();const id=Number($('builtin-title-id').value);editTitle(operations().titles.find(t=>t.id===id)||{id,name:'Original title #'+id,mode:'gradient',color1:0x8c5cc7,color2:0xd9b0ec,speed:100,enabled:1});});
$('title-assignment-form').addEventListener('submit',async event=>{event.preventDefault();await operate({action:'title.assign',license_id:Number($('assign-license').value),title_id:Number($('assign-title').value)},event.submitter);});
$('kog-fetch-form').addEventListener('submit',async event=>{event.preventDefault();const result=await operate({action:'kog.fetch',player:$('kog-player').value.trim()},event.submitter);if(result)toast('KoG lookup #'+result.job_id+' queued. Track its progress below.');});
$('block-ip-form').addEventListener('submit',async event=>{event.preventDefault();const ip=$('block-ip').value.trim();if(await confirmOperation('Block '+ip+'?','Incoming traffic from this IP will be dropped. SSH and your current admin address are protected.'))await operate({action:'network.block',ip},event.submitter);});
document.addEventListener('submit',async event=>{if(event.target.id!=='profile-role-form')return;event.preventDefault();await operate({action:'license.role',license_id:selectedId,role:$('profile-role').value},event.submitter);});
document.addEventListener('click',async event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.zoom){const key=button.dataset.chart;if(button.dataset.zoom==='reset')setChartWindow(key,0,1);else zoomChart(key,button.dataset.zoom==='in'?.65:1.5);$(`dashboard-grid`).querySelector(`[data-chart="${key}"][data-zoom="${button.dataset.zoom}"]`)?.focus();}
 if(button.dataset.revokeEditor&&await confirmOperation('Revoke title editor?','The key keeps its titles but can no longer create or edit them.'))await operate({action:'title.editor',license_id:Number(button.dataset.revokeEditor),enabled:false},button);
 if(button.dataset.editTitle)editTitle(operations().titles.find(t=>t.id===Number(button.dataset.editTitle)));
 if(button.dataset.unassignTitle&&await confirmOperation('Remove assigned title?','Only this title will be removed. Other titles assigned to the key are preserved.'))await operate({action:'title.assign',license_id:Number(button.dataset.unassignTitle),title_id:Number(button.dataset.unassignId),remove:true},button);
 if(button.dataset.profileTitle){const id=button.dataset.profileTitle;closeProfile();setView('titles');$('assign-license').value=id;$('assign-title').focus();}
 if(button.dataset.disconnectClient&&await confirmOperation('Disconnect this client?','The client will leave its current game on the next signed renewal, within 60 seconds. Its license stays active.'))await operate({action:'client.disconnect',license_id:Number(button.dataset.disconnectClient)},button);
 if(button.dataset.licenseAction&&await confirmOperation(button.dataset.licenseAction==='license.revoke'?'Block this key?':'Restore this key?',button.dataset.licenseAction==='license.revoke'?'Access will be revoked and the current token invalidated. Existing signed grants expire within 180 seconds.':'Restoration preserves the device binding. The player must activate again with the original key.'))await operate({action:button.dataset.licenseAction,license_id:Number(button.dataset.licenseId)},button);
 if(button.dataset.serviceRestart&&await confirmOperation('Restart '+button.dataset.serviceRestart+'?','Connected users may experience a brief interruption while this service restarts.'))await operate({action:'service.restart',service:button.dataset.serviceRestart},button);
 if(button.dataset.closeConnection){const c=networkData?.connections.find(c=>c.id===button.dataset.closeConnection);if(c&&await confirmOperation('Close this TCP connection?',c.local+' ↔ '+c.remote+'. Applications may reconnect automatically.'))await operate({action:'network.disconnect',connection_id:c.id},button);}
 if(button.dataset.blockIp&&await confirmOperation('Block '+button.dataset.blockIp+'?','Incoming traffic from this IP will be dropped. Existing SSH and your current admin address are protected.'))await operate({action:'network.block',ip:button.dataset.blockIp},button);
 if(button.dataset.unblockIp&&await confirmOperation('Unblock '+button.dataset.unblockIp+'?','Remove the dashboard firewall rule for this IP. Other firewall rules remain in effect.'))await operate({action:'network.unblock',ip:button.dataset.unblockIp},button);
});
$('export-audit').addEventListener('click',()=>{
 const rows=[['Time','Action','Target','Details'],...operations().audit.map(a=>[datetime(a.timestamp),a.action,a.target,a.details])];
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='novaclient-admin-audit.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('logout').addEventListener('click',()=>{networkController?.abort();networkData=null;networkLoadedAt=0;for(const id of ['network-table','network-services','host-metrics','blocked-ips','kog-jobs','kog-broadcasts','title-catalog','title-assignments','assign-title','assign-license','admin-audit'])$(id).replaceChildren();if($('operation-confirm').open)$('operation-confirm').close('cancel');$('operation-toast').hidden=true;});
