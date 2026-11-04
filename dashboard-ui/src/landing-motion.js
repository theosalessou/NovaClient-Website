import {animate,inView} from "motion";
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const toggle=document.querySelector('#motion-toggle');
let paused=false;let stop=()=>{};let running=[];
function reset(){stop();running.forEach(a=>a.stop());running=[];document.querySelectorAll('.reveal').forEach(el=>{el.style.opacity='';el.style.transform=''});if(paused||reduced.matches)return;stop=inView('.reveal',el=>{running.push(animate(el,{opacity:[0,1],transform:['translateY(14px)','translateY(0px)']},{duration:.45,ease:'easeOut'}));},{margin:'0px 0px -30px 0px'});}
toggle?.addEventListener('click',()=>{paused=!paused;toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'Resume motion':'Pause motion';reset()});reduced.addEventListener('change',reset);reset();
