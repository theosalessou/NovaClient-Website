import * as THREE from './assets/vendor/three.module.js';

// Every model is built for NovaClient. No remote models, textures or screenshots.
const state = () => window.novaState || { motion: !matchMedia('(prefers-reduced-motion: reduce)').matches, color:'#8c5cc7', tab:'movement', smoothing:60 };
const worlds = [];
const sphere = new THREE.SphereGeometry(1, 40, 28);
const mat = (color, metalness=.15, roughness=.4) => new THREE.MeshStandardMaterial({color,metalness,roughness});
const dark = mat('#15111d',.4,.43), purple = mat('#8c5cc7',.58,.28), white = mat('#f3edf8',.12,.3), pupil = mat('#08060d',.1,.3);
function mesh(geo, material, scale, position, parent) {
  const m = new THREE.Mesh(geo,material);m.scale.set(...scale);m.position.set(...position);parent.add(m);return m;
}
function tee(color='#8c5cc7') {
  const group=new THREE.Group(), bodyMaterial=mat(color,.35,.3);
  const body=mesh(sphere,bodyMaterial,[.83,.75,.68],[0,.34,0],group);
  const feet=[];
  for(const x of [-.46,.46]) {
    feet.push(mesh(sphere,bodyMaterial,[.43,.2,.54],[x,-.35,.18],group));
    const eye=mesh(sphere,white,[.22,.31,.13],[x*.48,.5,.62],group);
    const iris=mesh(sphere,pupil,[.082,.15,.065],[x*.48+.04,.49,.735],group);
    eye.rotation.z=x<0?-.13:.13;iris.rotation.z=eye.rotation.z;
  }
  group.userData={bodyMaterial,body,feet};return group;
}
function roundedBox(w,h,d, material) {
  const s=new THREE.Shape(),r=.1,hw=w/2,hh=h/2;
  s.moveTo(-hw+r,-hh);s.lineTo(hw-r,-hh);s.quadraticCurveTo(hw,-hh,hw,-hh+r);s.lineTo(hw,hh-r);s.quadraticCurveTo(hw,hh,hw-r,hh);s.lineTo(-hw+r,hh);s.quadraticCurveTo(-hw,hh,-hw,hh-r);s.lineTo(-hw,-hh+r);s.quadraticCurveTo(-hw,-hh,-hw+r,-hh);
  const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2,steps:1});g.translate(0,0,-d/2);
  return new THREE.Mesh(g,material);
}
function platform(parent,x,y,z,w=1.4,h=.6,d=1.3) {
  const p=roundedBox(w,h,d,dark);p.position.set(x,y,z);parent.add(p);
  const top=roundedBox(w+.015,.055,d+.015,purple);top.position.set(x,y+h/2,z);parent.add(top);return p;
}
function logo() {
  const g=new THREE.Group(),s=new THREE.Shape();
  s.moveTo(0,2.2);s.quadraticCurveTo(.22,.26,2.05,0);s.quadraticCurveTo(.24,-.2,0,-2.2);s.quadraticCurveTo(-.24,-.2,-2.05,0);s.quadraticCurveTo(-.22,.26,0,2.2);
  const shape=new THREE.ExtrudeGeometry(s,{depth:.23,bevelEnabled:true,bevelThickness:.085,bevelSize:.055,bevelSegments:4,curveSegments:36});shape.translate(0,0,-.115);
  g.add(new THREE.Mesh(shape,purple));
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(2,.085,14,150),purple);orbit.scale.set(1.35,1,1);orbit.rotation.set(1.05,-.35,.22);g.add(orbit);return g;
}
class World {
  constructor(canvas,kind) {
    this.canvas=canvas;this.kind=kind;this.visible=false;this.dirty=true;this.width=0;this.height=0;this.angle=0;this.pitch=0;this.targetAngle=0;this.targetPitch=0;this.initialized=false;
    this.resize=new ResizeObserver(()=>{this.size();this.dirty=true;});this.resize.observe(canvas);
    new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible){this.init();this.size();this.dirty=true;}},{rootMargin:'150px'}).observe(canvas);
    if(['hero','identity'].includes(kind))this.interaction();
  }
  init() {
    if(this.initialized)return;
    this.initialized=true;
    try {
      this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:true,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.25:1.6));
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.45;
      this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,1,.1,80);
      this.scene.add(new THREE.HemisphereLight('#e9def7','#241333',2.4));
      const key=new THREE.DirectionalLight('#f4eaff',4.5);key.position.set(-3,5,6);this.scene.add(key);
      const rim=new THREE.DirectionalLight('#8c5cc7',6);rim.position.set(4,2,-3);this.scene.add(rim);
      this.group=new THREE.Group();this.scene.add(this.group);
      this.build();this.size();
      if(this.kind==='hero')document.documentElement.classList.add('webgl-ready');
      this.canvas.dataset.ready='true';
    } catch(error) {
      this.failed=true;this.canvas.dataset.ready='fallback';
      if(this.renderer)this.renderer.dispose();
      // The hero retains the original Nova symbol; demos get an honest flat fallback.
      if(this.kind!=='hero')this.fallback();
      console.warn('NovaClient: 3D unavailable; using a static fallback.',error.message);
    }
  }
  size() {
    const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    this.width=r.width;this.height=r.height;
    if(!this.renderer||this.failed)return;
    this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;
    if(this.kind==='hero'){this.camera.position.set(0,.4,this.camera.aspect<1.3?11.6:8.8);this.camera.lookAt(0,0,0);}
    this.camera.updateProjectionMatrix();
  }
  build() {
    if(this.kind==='hero') {
      this.sculpture=logo();this.sculpture.rotation.set(.08,-.23,-.09);this.group.add(this.sculpture);
      this.tee=tee();this.tee.scale.setScalar(.56);this.tee.position.set(2,-.7,.6);this.tee.rotation.y=-.4;this.group.add(this.tee);
      // A short chain of map blocks is the path into the client, rather than abstract particles.
      for(let i=0;i<5;i++)platform(this.group,-3.9+i*.52,-1.65-Math.sin(i)*.13,-.5-i*.18,.48,.35,.48);
      this.camera.position.set(0,.4,8.8);this.camera.lookAt(0,0,0);
    } else if(this.kind==='identity') {
      this.tee=tee(state().color);this.tee.scale.setScalar(1.35);this.tee.position.y=.05;this.group.add(this.tee);
      const base=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.75,.18,64),dark);base.position.y=-.78;this.group.add(base);
      this.camera.position.set(0,1.5,7.1);this.camera.lookAt(0,.1,0);
    } else if(this.kind==='movement') {
      this.runners=[];
      for(const x of [-2.1,2.1]) {
        const runner=tee();runner.scale.setScalar(.68);runner.position.set(x,.15,0);this.group.add(runner);this.runners.push(runner);
        const track=new THREE.Mesh(new THREE.BoxGeometry(2.9,.15,5.4),dark);track.position.set(x,-.55,-.1);this.group.add(track);
        const stripe=new THREE.Mesh(new THREE.BoxGeometry(.04,.016,5.4),purple);stripe.position.set(x,-.46,-.1);this.group.add(stripe);
        for(let i=0;i<6;i++){const peg=new THREE.Mesh(new THREE.BoxGeometry(.17,.08,.045),purple);peg.position.set(x+1.1,-.43,i*.8-2.2);this.group.add(peg);}
      }
      this.camera.position.set(0,4.8,10.2);this.camera.lookAt(0,-.1,0);this.smoothZ=0;
    } else {
      this.tee=tee();this.tee.scale.setScalar(this.kind==='practice'?.62:.5);this.group.add(this.tee);
      for(let i=0;i<7;i++)platform(this.group,(i-3)*.8,Math.sin(i*.9)*.3-1,-(i-3)*.6,1,.55,1);
      this.anchor=new THREE.Vector3(1.1,2.1,-1.1);
      const block=roundedBox(1,.5,1,purple);block.position.copy(this.anchor);this.group.add(block);
      const points=[new THREE.Vector3(-1.2,0,0),new THREE.Vector3(-.8,1,0),this.anchor];
      this.rope=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.025,6,false),white);this.group.add(this.rope);this.rope.visible=false;
      this.camera.position.set(5,3.4,7);this.camera.lookAt(0,.1,0);this.group.rotation.y=-.25;
    }
  }
  interaction() {
    let down=false,last=0;
    this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;down=true;last=e.clientX;this.canvas.setPointerCapture(e.pointerId);});
    this.canvas.addEventListener('pointermove',e=>{const r=this.canvas.getBoundingClientRect();if(down){this.targetAngle+=(e.clientX-last)*.009;last=e.clientX;}else{this.targetAngle=(e.clientX-r.left-r.width/2)/r.width*.45;this.targetPitch=(e.clientY-r.top-r.height/2)/r.height*.15;}this.dirty=true;});
    const stop=()=>down=false;this.canvas.addEventListener('pointerup',stop);this.canvas.addEventListener('pointercancel',stop);
    this.canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();this.targetAngle+=e.key==='ArrowLeft'?-.25:.25;this.dirty=true;}});
  }
  update(t,delta) {
    if(!this.renderer||this.failed||!this.visible||!this.width||!this.height)return;
    const s=state();if(!s.motion&&!this.dirty)return;
    if(this.kind==='hero') {
      this.angle+=(this.targetAngle-this.angle)*(s.motion?.08:1);this.pitch+=(this.targetPitch-this.pitch)*(s.motion?.08:1);
      this.sculpture.rotation.y=-.23+this.angle+(s.motion?Math.sin(t*.28)*.16:0);this.sculpture.rotation.x=.08+this.pitch;
      this.sculpture.position.y=s.motion?Math.sin(t*.75)*.08:0;
      this.tee.position.y=-.7+(s.motion?Math.sin(t*1.1)*.1:0);
    }else if(this.kind==='identity') {
      this.angle+=(this.targetAngle-this.angle)*(s.motion?.1:1);this.tee.rotation.y=this.angle+(s.motion?Math.sin(t*.4)*.12:0);this.tee.userData.bodyMaterial.color.set(s.color);
    }else if(this.kind==='movement') {
      const target=Math.sin(t*1.2)*1.7;
      const raw=Math.round(target/.48)*.48;
      this.smoothZ+=(raw-this.smoothZ)*(s.smoothing===0?1:Math.min(1,delta/(s.smoothing/1000+.025)));
      this.runners[0].position.z=s.motion?raw:0;this.runners[1].position.z=s.motion?this.smoothZ:0;
      this.runners.forEach((runner,i)=>{runner.rotation.y=Math.cos(t*1.2)>0?.12:Math.PI*.9;runner.userData.feet.forEach((f,j)=>f.position.y=-.35+(s.motion?Math.sin(t*8+j*Math.PI)*.06:0));});
    }else{
      const hooked=this.kind==='practice'&&s.hook;
      this.rope.visible=hooked;
      this.tee.position.set(hooked?-1.2:Math.sin(s.motion?t*.5:0)*1.25,hooked?0:.05,-.1);
      this.tee.rotation.y=-.4+(s.motion?Math.sin(t*.6)*.2:0);
    }
    this.renderer.render(this.scene,this.camera);this.dirty=false;
  }
  fallback() {
    const wrap=document.createElement('div');wrap.className='flat-fallback';wrap.textContent='3D is unavailable in this browser. Explore the client controls and features below.';this.canvas.replaceWith(wrap);
  }
}
for(const [id,kind] of [['nova-world','hero'],['movement-world','movement'],['hud-world','hud'],['identity-world','identity'],['practice-world','practice']]) {
  const c=document.getElementById(id);if(c)worlds.push(new World(c,kind));
}
let previous=performance.now(),time=1.8,lastReplay=0;
function frame(now){const delta=Math.min(.05,(now-previous)/1000);previous=now;if(!document.hidden){if(state().motion)time+=delta;if(state().replay!==lastReplay){time=0;lastReplay=state().replay;}for(const w of worlds)w.update(time,delta);}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
addEventListener('nova:change',()=>{worlds.forEach(w=>{w.dirty=true;if(w.visible)w.size();});});
addEventListener('nova:orbit',()=>{const w=worlds.find(w=>w.kind==='hero');if(w){w.targetAngle+=Math.PI/2;w.dirty=true;}});
addEventListener('visibilitychange',()=>{previous=performance.now();worlds.forEach(w=>w.dirty=true);});
addEventListener('pagehide',event=>{if(!event.persisted)worlds.forEach(w=>w.renderer?.dispose());});
