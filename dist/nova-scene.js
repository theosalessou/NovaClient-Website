import * as THREE from './assets/vendor/three.module.js';
const canvas=document.querySelector('#nova-scene');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
try {
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,0,11);
const group=new THREE.Group();scene.add(group);
// Extruded four-point Nova star. Curved arms follow the original mark's silhouette.
const shape=new THREE.Shape();shape.moveTo(0,2.7);shape.bezierCurveTo(.22,.8,.8,.28,2.7,0);shape.bezierCurveTo(.8,-.24,.22,-.8,0,-2.7);shape.bezierCurveTo(-.22,-.8,-.8,-.24,-2.7,0);shape.bezierCurveTo(-.8,.28,-.22,.8,0,2.7);
const hole=new THREE.Path();hole.moveTo(0,1.42);hole.bezierCurveTo(-.12,.4,-.4,.12,-1.42,0);hole.bezierCurveTo(-.4,-.12,-.12,-.4,0,-1.42);hole.bezierCurveTo(.12,-.4,.4,-.12,1.42,0);hole.bezierCurveTo(.4,.12,.12,.4,0,1.42);shape.holes.push(hole);
const geometry=new THREE.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:true,bevelThickness:.11,bevelSize:.065,bevelSegments:5,curveSegments:48});geometry.center();
const material=new THREE.MeshPhysicalMaterial({color:0x7132cc,metalness:.82,roughness:.12,clearcoat:1,clearcoatRoughness:.045,emissive:0x370a72,emissiveIntensity:.35});
const star=new THREE.Mesh(geometry,material);group.add(star);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.55,.085,20,180),material);ring.rotation.set(1.05,.3,-.45);ring.scale.set(1.28,.66,1);group.add(ring);
// Bright studio strips reflected across the polished bevels.
scene.add(new THREE.HemisphereLight(0xd8c9ff,0x170324,2));
for(const [color,intensity,x,y,z] of [[0xffffff,90,-3,4,4],[0xb16aff,100,4,1,2],[0x7020ff,65,-3,-3,1],[0xffffff,45,0,-1,5]]){const l=new THREE.PointLight(color,intensity,20,2);l.position.set(x,y,z);scene.add(l)}
const envScene=new THREE.Scene();envScene.background=new THREE.Color('#21142d');
for(const [x,y,z,sx,sy] of [[-3,2,2,2,7],[3,1,1,1,8],[0,4,0,8,2]]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);envScene.add(panel)}
const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(envScene,.04);scene.environment=env.texture;pmrem.dispose();
const positions=new Float32Array(360);for(let i=0;i<positions.length;i+=3){positions[i]=(Math.random()-.5)*20;positions[i+1]=(Math.random()-.5)*12;positions[i+2]=-2-Math.random()*9}
const particles=new THREE.BufferGeometry();particles.setAttribute('position',new THREE.BufferAttribute(positions,3));scene.add(new THREE.Points(particles,new THREE.PointsMaterial({color:0xb79ace,size:.018,transparent:true,opacity:.55})));
let targetX=.12,targetY=-.3,rx=.12,ry=-.3,drag=false,lastX=0,lastY=0,raf=0;
function resize(){const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.position.z=r.width<650?14:11;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(canvas.parentElement);resize();
canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')});
canvas.addEventListener('pointermove',e=>{if(reduce.matches)return;if(drag){targetY+=(e.clientX-lastX)*.008;targetX+=(e.clientY-lastY)*.006;lastX=e.clientX;lastY=e.clientY}else{targetY=(e.offsetX/canvas.clientWidth-.5)*.65;targetX=(e.offsetY/canvas.clientHeight-.5)*.35}});
canvas.addEventListener('pointerup',()=>{drag=false;canvas.classList.remove('dragging')});canvas.addEventListener('pointercancel',()=>{drag=false});
function draw(t){raf=requestAnimationFrame(draw);if(document.hidden)return;const motion=!reduce.matches&&!document.documentElement.classList.contains('motion-off');if(motion){rx+=(targetX-rx)*.055;ry+=(targetY-ry)*.055;const scroll=Math.min(1,scrollY/innerHeight);group.rotation.set(rx,ry+scroll*.85,-.15);group.position.y=Math.sin(t*.00055)*.1;group.position.x=canvas.clientWidth>800?1.1:0;ring.rotation.z=-.45+Math.sin(t*.0002)*.1;}renderer.render(scene,camera)}
canvas.parentElement.classList.add('webgl-ready');draw(0);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);canvas.parentElement.classList.remove('webgl-ready')});
}catch(error){console.warn('Nova 3D unavailable; showing original emblem.',error)}
