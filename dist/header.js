(()=>{'use strict';
const API='https://api.novaclient.tech/license/account';
const account=document.querySelector('#header-account'),logout=document.querySelector('#logout');
if(!account||!logout)return;
account.href='/account/';
let requestNumber=0;
if(!localStorage.getItem('nova-session')&&sessionStorage.getItem('nova-session'))localStorage.setItem('nova-session',sessionStorage.getItem('nova-session'));
function render(state){
 const signed=state.authenticated===true||Object.hasOwn(state,'csrf');
 account.replaceChildren();logout.hidden=!signed;
 account.classList.toggle('is-connected',signed);
 if(!signed){account.textContent='Sign in with Discord';account.setAttribute('aria-label','Sign in with Discord');return}
 const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
 const path=document.createElementNS(icon.namespaceURI,'path');path.setAttribute('d','M12 2Q13 10 22 12Q13 13 12 22Q11 13 2 12Q11 11 12 2Z');icon.append(path);
 const name=document.createElement('span');name.className='header-player-name';name.textContent=state.profile?.name||'Your account';account.append(icon,name);
 if(state.profile?.role){const role=document.createElement('span');role.className='header-player-role';role.textContent=state.profile.role;account.append(role)}
 account.setAttribute('aria-label','Open profile: '+name.textContent);
}
async function identity(){const ticket=++requestNumber,token=localStorage.getItem('nova-session');if(!token){render({});return}account.textContent='Your account';account.classList.add('is-connected');try{
 const response=await fetch(API+'/identity',{cache:'no-store',credentials:'omit',headers:{Authorization:'Bearer '+token}});
 if(ticket!==requestNumber||localStorage.getItem('nova-session')!==token)return;
 if(response.status===401){localStorage.removeItem('nova-session');sessionStorage.removeItem('nova-session');render({});return}
 if(!response.ok)throw new Error('temporarily unavailable');render(await response.json());
}catch{account.textContent='My profile';account.setAttribute('aria-label','Open my profile');logout.hidden=false}}
logout.addEventListener('click',async()=>{logout.disabled=true;try{
 const token=localStorage.getItem('nova-session');if(token){const headers={Authorization:'Bearer '+token};const state=await fetch(API+'/state',{credentials:'omit',headers});if(state.ok){const data=await state.json();const result=await fetch(API+'/logout',{method:'POST',credentials:'omit',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf:data.csrf})});if(!result.ok)throw new Error('Sign out failed')}}
 localStorage.removeItem('nova-session');sessionStorage.removeItem('nova-session');location.reload();
}catch{logout.disabled=false;logout.title='Could not sign out. Try again.'}});
document.addEventListener('nova-account-state',event=>{requestNumber++;render(event.detail)});
window.addEventListener('storage',event=>{if(event.key==='nova-session')identity()});
document.addEventListener('nova-session-changed',identity);
window.addEventListener('pageshow',identity);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)identity()});
for(const link of document.querySelectorAll('.site-header .icon-nav a')){const url=new URL(link.href);if(!url.hash&&url.pathname.replace(/\/$/,'')===location.pathname.replace(/\/$/,''))link.setAttribute('aria-current','page')}
identity();
})();
