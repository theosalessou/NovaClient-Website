import * as THREE from './assets/vendor/three.module.js';
const canvas=document.querySelector('#nova-scene');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
// Preserve the hero's space while the actual canvas travels in the viewport.
const wrap=canvas.parentElement,anchor=document.createElement('div');
anchor.className='scene-anchor';anchor.setAttribute('aria-hidden','true');
wrap.before(anchor);document.body.append(wrap);wrap.classList.add('scene-traveller');
let destination={x:0,y:0,size:300,opacity:1},current=null,needsLayout=true;
function layoutTraveller(){
 const r=anchor.getBoundingClientRect(),mobile=innerWidth<761;
 // A single continuous composition: hero foreground becomes a quiet background.
 const progress=Math.min(1,Math.max(0,-r.top/(innerHeight*.65)));
 const heroSize=Math.min(r.width,r.height);
 const size=heroSize+(Math.min(innerWidth*(mobile?.86:.43),620)-heroSize)*progress;
 const heroX=r.left+(r.width-heroSize)/2,heroY=r.top+(r.height-heroSize)/2;
 destination={x:heroX+(innerWidth-size*.83-heroX)*progress,
 y:heroY+(innerHeight*.5-size*.5-heroY)*progress,size,opacity:1-progress*.78};
 wrap.classList.toggle('scene-background',progress>.1);
}
addEventListener('scroll',()=>{needsLayout=true},{passive:true});addEventListener('resize',()=>{needsLayout=true},{passive:true});

try {
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,0,11);
const group=new THREE.Group();scene.add(group);
// Extruded four-point Nova star. Curved arms follow the original mark's silhouette.
const shape=new THREE.Shape();shape.moveTo(0,2.7);shape.bezierCurveTo(.22,.8,.8,.28,2.7,0);shape.bezierCurveTo(.8,-.24,.22,-.8,0,-2.7);shape.bezierCurveTo(-.22,-.8,-.8,-.24,-2.7,0);shape.bezierCurveTo(-.8,.28,-.22,.8,0,2.7);
const hole=new THREE.Path();hole.moveTo(0,1.42);hole.bezierCurveTo(-.12,.4,-.4,.12,-1.42,0);hole.bezierCurveTo(-.4,-.12,-.12,-.4,0,-1.42);hole.bezierCurveTo(.12,-.4,.4,-.12,1.42,0);hole.bezierCurveTo(.4,.12,.12,.4,0,1.42);shape.holes.push(hole);
const geometry=new THREE.ExtrudeGeometry(shape,{depth:.64,bevelEnabled:true,bevelThickness:.2,bevelSize:.065,bevelSegments:8,curveSegments:48});geometry.center();
const material=new THREE.MeshPhysicalMaterial({color:0x9462cf,metalness:.94,roughness:.18,clearcoat:1,clearcoatRoughness:.045,emissive:0x370a72,emissiveIntensity:.35});
const star=new THREE.Mesh(geometry,material);group.add(star);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.55,.085,20,180),material);ring.rotation.set(.55,.3,-.65);ring.scale.set(1.12,.57,1);group.add(ring);
// Luminous front and rear bevels give the emblem a layered machined edge.
const rimMaterial=new THREE.MeshBasicMaterial({color:0xa567ed,transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false});
for(const z of [-.38,.38]){
 const rim=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,32),new THREE.LineBasicMaterial({color:0xba83f0,transparent:true,opacity:.38,blending:THREE.AdditiveBlending,depthWrite:false}));
 rim.scale.setScalar(1.006);rim.position.z=z*.12;star.add(rim);
}
const orbit=new THREE.Group();group.add(orbit);orbit.rotation.set(-.65,.65,.35);
const outerRing=new THREE.Mesh(new THREE.TorusGeometry(2.85,.024,12,180),rimMaterial);orbit.add(outerRing);
for(let i=0;i<3;i++){
 const bead=new THREE.Mesh(new THREE.IcosahedronGeometry(.065,1),rimMaterial);
 const angle=i*Math.PI*2/3;bead.position.set(Math.cos(angle)*2.85,Math.sin(angle)*2.85,0);orbit.add(bead);
}
// Soft additive light, without a full-screen bloom pass.
const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
const glowContext=glowCanvas.getContext('2d');
const glowGradient=glowContext.createRadialGradient(64,64,0,64,64,64);
glowGradient.addColorStop(0,'rgba(150,65,235,.48)');glowGradient.addColorStop(.35,'rgba(114,37,193,.22)');glowGradient.addColorStop(1,'rgba(87,20,150,0)');
glowContext.fillStyle=glowGradient;glowContext.fillRect(0,0,128,128);
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
glow.scale.set(8.5,8.5,1);glow.position.z=-.7;group.add(glow);
// Bright studio strips reflected across the polished bevels.
scene.add(new THREE.HemisphereLight(0xd8c9ff,0x170324,2));
for(const [color,intensity,x,y,z] of [[0xffffff,90,-3,4,4],[0xb16aff,100,4,1,2],[0x7020ff,65,-3,-3,1],[0xffffff,45,0,-1,5]]){const l=new THREE.PointLight(color,intensity,20,2);l.position.set(x,y,z);scene.add(l)}
const envScene=new THREE.Scene();envScene.background=new THREE.Color('#21142d');
for(const [x,y,z,sx,sy] of [[-3,2,2,2,7],[3,1,1,1,8],[0,4,0,8,2]]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);envScene.add(panel)}
const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(envScene,.04);scene.environment=env.texture;pmrem.dispose();
const positions=new Float32Array(360);for(let i=0;i<positions.length;i+=3){positions[i]=(Math.random()-.5)*20;positions[i+1]=(Math.random()-.5)*12;positions[i+2]=-2-Math.random()*9}
const particles=new THREE.BufferGeometry();particles.setAttribute('position',new THREE.BufferAttribute(positions,3));scene.add(new THREE.Points(particles,new THREE.PointsMaterial({color:0xb79ace,size:.018,transparent:true,opacity:.55})));
let sectionTone=0;
const tones=[0x9462cf,0x8871cc,0x706bb4,0xbd79a6,0xab80d7];
const targetColor=new THREE.Color(tones[0]);
const storyObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){sectionTone=Number(e.target.dataset.scene)||0;targetColor.setHex(tones[sectionTone]);}}, {rootMargin:'-15% 0px -45% 0px'});
document.querySelectorAll('[data-scene]').forEach(el=>storyObserver.observe(el));
document.querySelectorAll('a,button,.input-modes li').forEach(el=>el.addEventListener('pointerenter',()=>{targetY+=.14}));
let targetX=.12,targetY=-.3,rx=.12,ry=-.3,spin=0,lastTime=0,drag=false,lastX=0,lastY=0,raf=0;
function resize(){const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=Math.max(10.5,10.5/camera.aspect);camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(canvas.parentElement);resize();
canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')});
canvas.addEventListener('pointermove',e=>{if(reduce.matches)return;if(drag){targetY+=(e.clientX-lastX)*.008;targetX+=(e.clientY-lastY)*.006;lastX=e.clientX;lastY=e.clientY}else{targetY=(e.offsetX/canvas.clientWidth-.5)*.65;targetX=(e.offsetY/canvas.clientHeight-.5)*.35}});
canvas.addEventListener('pointerup',()=>{drag=false;canvas.classList.remove('dragging')});canvas.addEventListener('pointercancel',()=>{drag=false});
function draw(t){raf=requestAnimationFrame(draw);if(document.hidden)return;
if(needsLayout){layoutTraveller();needsLayout=false}
if(!current)current={...destination};const ease=reduce.matches?1:.085;
for(const key of ['x','y','size','opacity'])current[key]+=(destination[key]-current[key])*ease;
wrap.style.transform=`translate3d(${current.x}px,${current.y}px,0)`;wrap.style.width=Math.round(current.size)+'px';wrap.style.height=Math.round(current.size)+'px';
wrap.style.opacity=String(current.opacity);canvas.style.pointerEvents='none';
const delta=Math.min(.05,Math.max(0,(t-lastTime)/1000));lastTime=t;
const motion=!reduce.matches&&!document.documentElement.classList.contains('motion-off');if(motion){rx+=(targetX-rx)*.055;ry+=(targetY-ry)*.055;spin+=delta*.19;
group.rotation.set(rx+Math.sin(t*.0003)*.08,ry+spin,-.18+Math.sin(spin*.5)*.12);
group.position.y=Math.sin(t*.00065)*.14;
group.position.x=0;
group.scale.setScalar(1);material.color.lerp(targetColor,.035);
ring.rotation.z=-.65+spin*.3;orbit.rotation.z=.35-spin*.22;
canvas.style.opacity="1";}renderer.render(scene,camera)}
document.addEventListener('pointermove',e=>{if(reduce.matches||drag||e.pointerType==='touch')return;targetY=(e.clientX/innerWidth-.5)*.7;targetX=(e.clientY/innerHeight-.5)*.4},{passive:true});
canvas.parentElement.classList.add('webgl-ready');draw(0);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);canvas.parentElement.classList.remove('webgl-ready')});
}catch(error){console.warn('Nova 3D unavailable; showing original emblem.',error)}
