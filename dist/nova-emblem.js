import * as THREE from './assets/vendor/three.module.js';
import { cameraDistance, cinematicFlight } from './emblem-journey.js?v=11';
// A transparent viewport with a bounded backing buffer, never a cropped square.
export function createEmblem(canvas,{onFrame=()=>{}}={}){
 const compact=innerWidth<800||innerHeight<560;
 const constrained=compact||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4;
 let budget=constrained?512:640;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!constrained,powerPreference:'low-power'});
 renderer.setClearColor(0x000000,0);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.90;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100),group=new THREE.Group();scene.add(group);
 const shape=new THREE.Shape();shape.moveTo(0,2.7);
 shape.bezierCurveTo(.22,.8,.8,.28,2.7,0);shape.bezierCurveTo(.8,-.24,.22,-.8,0,-2.7);
 shape.bezierCurveTo(-.22,-.8,-.8,-.24,-2.7,0);shape.bezierCurveTo(-.8,.28,-.22,.8,0,2.7);
 const hole=new THREE.Path();hole.moveTo(0,1.42);hole.bezierCurveTo(-.12,.4,-.4,.12,-1.42,0);
 hole.bezierCurveTo(-.4,-.12,-.12,-.4,0,-1.42);hole.bezierCurveTo(.12,-.4,.4,-.12,1.42,0);hole.bezierCurveTo(.4,.12,.12,.4,0,1.42);shape.holes.push(hole);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelThickness:.10,bevelSize:.075,bevelSegments:constrained?2:5,curveSegments:constrained?16:40});geo.center();
 // A self-luminous stellar surface, not polished plastic: no specular model.
 const stellarUniforms={uTime:{value:0},uColor:{value:new THREE.Color(0x8733bb)},uEnergy:{value:1}};
 const stellarVertex=`varying vec3 vPosition;varying vec3 vNormal;varying vec3 vView;
 void main(){vPosition=position;vec4 mv=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
 const material=new THREE.ShaderMaterial({uniforms:stellarUniforms,vertexShader:stellarVertex,fragmentShader:`
 uniform float uTime;uniform float uEnergy;uniform vec3 uColor;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vView;
 void main(){
  float field=sin(vPosition.x*5.0+sin(vPosition.y*4.0-uTime*.28))*sin(vPosition.y*6.0+uTime*.24);
  float grain=sin(vPosition.x*31.0+sin(vPosition.y*23.0))*sin(vPosition.y*27.0-uTime*.18);
  float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.2);
  float vein=pow(.5+.5*sin(vPosition.x*8.0+vPosition.y*4.0+field*2.0-uTime*.38),7.0);
  vec3 nebula=mix(vec3(.055,.008,.12),uColor*.82,.46+field*.12+grain*.035);
  vec3 emission=nebula+vec3(.40,.15,.66)*vein*.38+vec3(.72,.46,.95)*rim*.68;
  float veil=.10+rim*.42+vein*.16+(.5+.5*field)*.06;
  gl_FragColor=vec4(emission*uEnergy,veil);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 // Keep the existing damped color API while shading through an emission uniform.
 material.color=stellarUniforms.uColor.value;
 const star=new THREE.Mesh(geo,material);star.name='nova-emblem';star.renderOrder=2;group.add(star);
 const corona=new THREE.Mesh(geo,new THREE.ShaderMaterial({uniforms:stellarUniforms,vertexShader:stellarVertex,transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,fragmentShader:`
 uniform float uTime;varying vec3 vNormal;varying vec3 vView;varying vec3 vPosition;
 void main(){float edge=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.6);float flow=.82+.18*sin(vPosition.y*3.0+vPosition.x*2.0-uTime*.7);gl_FragColor=vec4(.51,.23,.83,edge*flow*.22);}` }));
 corona.name='stellar-corona';corona.scale.setScalar(1.065);group.add(corona);
 const ringMaterial=new THREE.MeshBasicMaterial({color:0xa974d6,transparent:true,opacity:.30,depthWrite:false});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(3.4,.028,constrained?8:12,constrained?56:112),ringMaterial);ring.rotation.set(.55,.3,-.65);ring.scale.set(1.1,.94,1);group.add(ring);
 const orbitMaterial=new THREE.MeshBasicMaterial({color:0xa161c8,transparent:true,opacity:.20,depthWrite:false});
 const orbit=new THREE.Mesh(new THREE.TorusGeometry(4.0,.011,6,constrained?56:112),orbitMaterial);orbit.rotation.set(-.65,.65,.35);group.add(orbit);ring.name='stellar-inner-orbit';orbit.name='stellar-outer-orbit';ring.renderOrder=orbit.renderOrder=1;
 const lightCanvas=document.createElement('canvas');lightCanvas.width=lightCanvas.height=128;
 const ctx=lightCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,0,64,64,64);
 gradient.addColorStop(0,'rgba(168,70,235,.32)');gradient.addColorStop(.35,'rgba(128,34,210,.12)');gradient.addColorStop(1,'rgba(72,12,116,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const glowTexture=new THREE.CanvasTexture(lightCanvas);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));glow.scale.set(7.2,7.2,1);glow.position.z=-1;group.add(glow);
 glow.material.opacity=.18;glow.scale.set(8,8,1);
 // One bounded point cloud in the existing scene: seeded, depth-aware, no second loop.
 const count=Math.min(constrained?32:120,Math.max(32,Math.round(innerWidth*innerHeight/6500))),positions=new Float32Array(count*3),seeds=new Float32Array(count);
 let seed=9173;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<count;i++){const a=random()*Math.PI*2,z=random()*2-1,r=3.4+random()*4.2,k=Math.sqrt(1-z*z);positions.set([Math.cos(a)*k*r,z*r,Math.sin(a)*k*r-1.5],i*3);seeds[i]=random();}
 const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));dustGeometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
 const dust=new THREE.Points(dustGeometry,new THREE.ShaderMaterial({uniforms:stellarUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,vertexShader:`
 uniform float uTime;attribute float aSeed;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vAlpha=.20+.32*(.5+.5*sin(uTime*.65+aSeed*18.0));gl_PointSize=clamp((13.0+aSeed*12.0)/max(1.0,-mv.z),1.0,3.0);gl_Position=projectionMatrix*mv;}`,fragmentShader:`
 varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=(1.0-smoothstep(.08,.5,d))*vAlpha;gl_FragColor=vec4(.71,.56,.92,a);}` }));dust.name='stellar-dust';group.add(dust);
 const names=['INPUTS','PRACTICE','PERSPECTIVE','CONNECTION'];
 function labelTexture(index,core=false){
  const c=document.createElement('canvas');c.width=512;c.height=core?256:112;const x=c.getContext('2d');
  // Transparent lettering: no black label rectangles over the sculpture.
  x.fillStyle='#f1e6f8';x.textAlign='center';x.textBaseline='middle';x.font=`600 ${core?56:38}px Manrope,Arial,sans-serif`;
  if(core){x.fillText(index===0?'13 INPUT MODES':names[index],256,95);x.font='400 25px Manrope,Arial,sans-serif';x.fillStyle='#ccacdf';x.fillText(['Prediction · smoothing · control','Fast Practice + Copy World','Camera · HUD · Aspect ratio','Team Panel · Voice on Windows'][index],256,166);}
  else x.fillText(names[index],256,56);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
 }
 const textureCache=new Map(),pending=new Set();const sourceFiles=[null,'fast-practice.png','minimap.png','team-panel.png'];
 const board=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));board.renderOrder=30;board.name='real-feature-surface';board.position.set(0,.05,.78);group.add(board);
 const mediaHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xab62e4,transparent:true,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false}));mediaHalo.name='media-light-spill';mediaHalo.renderOrder=29;group.add(mediaHalo);
 let active=false,disposed=false,frame=0,dirty=true,lastTime=0,slowFrames=0,continuing=false,passiveTimer=0,drift=0,passiveAllowed=true,transitOrigin=1,flightInitialized=false;
 let feature=-1,target={x:.08,y:-.25,z:-.10,tone:0x8733bb,energy:.25,phase:0,flight:-1,reveal:0,zoom:1,fx:0,fy:0,fz:0},current={...target};
 const targetColor=new THREE.Color(target.tone);const loader=new THREE.TextureLoader();
 function schedule(){if(active&&!disposed&&!frame)frame=requestAnimationFrame(draw);}
 function applyTexture(index){const tex=textureCache.get(index);if(!tex)return;board.material.map=tex;board.material.needsUpdate=true;
  const image=tex.image;const aspect=image?.width&&image?.height?image.width/image.height:2;
  const width=index===2?.95:1.25;board.scale.set(width,width/aspect,1);dirty=true;schedule();}
 function selectFeature(index){
  if(feature===index)return;feature=index;
  if(!textureCache.has(index))textureCache.set(index,labelTexture(index,true));applyTexture(index);
  if(index===0||pending.has(index)||textureCache.get(index).userData.native)return;pending.add(index);
  loader.load('./assets/features/'+sourceFiles[index],tex=>{
   if(disposed){tex.dispose();return;}tex.colorSpace=THREE.SRGBColorSpace;tex.userData.native=true;
   textureCache.get(index)?.dispose();textureCache.set(index,tex);if(feature===index)applyTexture(index);
  },undefined,()=>{/* Existing labelled surface remains on image failure; no retry loop. */});
 }
 function resize(){
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
  const scale=Math.min(1,Math.sqrt(budget*budget/(w*h)),1280/w,900/h);
  renderer.setSize(Math.max(1,Math.floor(w*scale)),Math.max(1,Math.floor(h*scale)),false);
  camera.aspect=w/h;camera.position.set(0,0,cameraDistance(camera.aspect));camera.updateProjectionMatrix();
  group.position.y=(w<800||h<560)?camera.position.z*Math.tan(Math.PI/10)*(camera.aspect<.9?.25:.07):.25;
  dirty=true;schedule();
 }
 function draw(time){
  frame=0;if(!active||disposed)return;const frameStarted=performance.now();
  const gap=lastTime?time-lastTime:0,late=continuing&&gap>42&&gap<250;
  const dt=lastTime?Math.min(.05,gap/1000):1/60;lastTime=time;const ease=1-Math.exp(-5.5*dt);let error=0;
  for(const key of['x','y','z','energy','phase','zoom','fx','fy','fz','reveal','flight']){current[key]+=(target[key]-current[key])*ease;error+=Math.abs(target[key]-current[key]);}
  material.color.lerp(targetColor,ease);error+=Math.abs(material.color.r-targetColor.r)+Math.abs(material.color.g-targetColor.g)+Math.abs(material.color.b-targetColor.b);
  const settling=error>.001;if(!settling){for(const key of['x','y','z','energy','phase','zoom','fx','fy','fz','reveal','flight'])current[key]=target[key];material.color.copy(targetColor);}
  if(dirty||settling){
   if(passiveAllowed&&!constrained&&budget>512)drift+=dt;
   const breathing=1+Math.sin(drift*.9)*.07;
   stellarUniforms.uTime.value=drift+current.phase;
   dust.rotation.set(Math.sin(drift*.12)*.12,drift*.045,current.phase*.08);
   glow.scale.set(7.2*breathing,7.2*breathing,1);

   group.rotation.set(current.x+Math.sin(drift*.65)*.12,current.y+Math.sin(drift*.47)*.18,current.z+Math.sin(drift*.53)*.075);ring.rotation.set(.55+Math.sin(drift*.22)*.18,.3+drift*.20,-.65+current.phase*.22+drift*.48);orbit.rotation.set(-.65+drift*.16,.65+Math.sin(drift*.28)*.28,.35+current.phase*.22-drift*.38);
   // Both hoops remain behind the stellar body relative to the visited side.
   const routeZ=current.flight>=0?cinematicFlight(current.flight,cameraDistance(camera.aspect)).position[2]:10;
   const side=Math.tanh(routeZ/2),fade=Math.max(0,Math.min(1,(Math.abs(routeZ)-3)/3));
   ring.position.z=-4.8*side;orbit.position.z=-5.3*side;
   ringMaterial.opacity=.30*fade;orbitMaterial.opacity=.20*fade;
   // Focus is model-local, transformed after the current body rotation.
   group.updateMatrixWorld(true);
   const focus=new THREE.Vector3(current.fx,current.fy,current.fz).applyMatrix4(group.matrixWorld);
   const distance=cameraDistance(camera.aspect);
   const previousOrientation=camera.quaternion.clone();
   camera.position.set(focus.x,focus.y,focus.z+distance);
   camera.lookAt(focus);camera.zoom=current.zoom;
   if(current.flight>=0){if(current.flight<.44)transitOrigin=1;else if(current.flight>.68)transitOrigin=-1;const path=cinematicFlight(current.flight,distance);camera.position.copy(new THREE.Vector3(...path.position).applyMatrix4(group.matrixWorld));if(current.flight<.44||current.flight>=.68){camera.lookAt(new THREE.Vector3(...path.look).applyMatrix4(group.matrixWorld));}else camera.quaternion.copy(group.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,path.yaw,path.roll)));if(transitOrigin<0){const weight=Math.min(1,Math.max(0,(current.flight-.36)/.08))*Math.min(1,Math.max(0,(.76-current.flight)/.08));const forward=new THREE.Quaternion().copy(group.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,Math.PI,-path.roll)));camera.quaternion.slerp(forward,weight);}const desired=camera.quaternion.clone();if(flightInitialized)camera.quaternion.copy(previousOrientation).slerp(desired,1-Math.exp(-4.5*dt));else camera.quaternion.copy(desired);flightInitialized=true;camera.zoom=1;}
   camera.updateProjectionMatrix();
   // The real feature surface travels with the physical detail being explored.
   board.position.set(current.fx-.60,current.fy+(innerWidth<800?1.12:.28),.80);
   board.visible=current.flight<0&&feature!==0&&current.reveal>.98;

   const illumination=.30+(.5+.5*Math.sin(drift*.8+current.phase))*.28;
   stellarUniforms.uEnergy.value=1.05+illumination*.22;
   mediaHalo.visible=board.visible;mediaHalo.position.copy(board.position);mediaHalo.scale.set(board.scale.x*1.8,board.scale.y*2.5,1);mediaHalo.material.opacity=illumination*.65;
   board.material.color.setRGB(.91+illumination*.08,.88+illumination*.13,.96+illumination*.04);

   camera.updateMatrixWorld(true);group.updateMatrixWorld(true);
   // The DOM planes use the exact model/view/projection matrices, not an unrelated orbit.
   const width=Math.min(innerWidth<800?innerWidth-48:350,350),height=current.flight>=0?Math.min(innerHeight-190,440):280;
   const units=2*distance*Math.tan(Math.PI/10)/(current.zoom*innerHeight);
   const local=new THREE.Matrix4().makeTranslation(current.fx+(innerWidth<800?0:.92),current.fy-(innerWidth<800?1.12:.48),1.05);
   const basis=new THREE.Matrix4().makeScale(units,-units,units);
   const center=new THREE.Matrix4().makeTranslation(-width/2,-height/2,0);
   const viewport=new THREE.Matrix4().set(innerWidth/2,0,0,innerWidth/2,0,-innerHeight/2,0,innerHeight/2,0,0,1,0,0,0,0,1);
   const matrix=viewport.multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(group.matrixWorld).multiply(local).multiply(basis).multiply(center);
   if(current.flight>=0){
    // Tangential reading plane travels in the same 3D scene, facing the current side.
    const depth=5,unit=2*depth*Math.tan(Math.PI/10)/innerHeight;
    const sway=Math.sin(current.phase)*.35;
    const plane=new THREE.Matrix4().makeTranslation(sway,-.35,-depth).multiply(new THREE.Matrix4().makeRotationY(Math.sin(current.phase)*.13)).multiply(new THREE.Matrix4().makeRotationX(Math.sin(current.phase*.8)*.06));
    matrix.copy(new THREE.Matrix4().set(innerWidth/2,0,0,innerWidth/2,0,-innerHeight/2,0,innerHeight/2,0,0,1,0,0,0,0,1)).multiply(camera.projectionMatrix).multiply(plane).multiply(new THREE.Matrix4().makeScale(unit,-unit,unit)).multiply(center);
   }
   // Resolve screen-space collisions without changing the model's XYZ orientation.
   const corners=[[0,0],[width,0],[0,current.flight>=0?height:240],[width,current.flight>=0?height:240]].map(([x,y])=>new THREE.Vector3(x,y,0).applyMatrix4(matrix));
   const bounds={left:Math.min(...corners.map(v=>v.x)),right:Math.max(...corners.map(v=>v.x)),top:Math.min(...corners.map(v=>v.y)),bottom:Math.max(...corners.map(v=>v.y))};
   const bw=bounds.right-bounds.left,bh=bounds.bottom-bounds.top;
   const safeTop=innerWidth<800&&innerHeight>=560?150:96;
   let fit=Math.min(1,(innerWidth-48)/bw,(innerHeight-safeTop-68)/bh);

   const points=[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]].map(([x,y])=>new THREE.Vector3(x,y,0).applyMatrix4(board.matrixWorld).project(camera));
   const media={left:Math.min(...points.map(v=>(v.x+1)*innerWidth/2)),right:Math.max(...points.map(v=>(v.x+1)*innerWidth/2)),top:Math.min(...points.map(v=>(1-v.y)*innerHeight/2)),bottom:Math.max(...points.map(v=>(1-v.y)*innerHeight/2))};
   if(board.visible&&innerWidth<800&&innerHeight>=560)fit=Math.min(fit,Math.max(.65,(innerHeight-88-media.bottom)/bh));
   const sw=bw*fit,sh=bh*fit;
   const safe=(x,y)=>({x:Math.max(24,Math.min(innerWidth-24-sw,x)),y:Math.max(safeTop,Math.min(innerHeight-64-sh,y))});
   const preferred=safe(bounds.left,bounds.top);
   const candidates=[preferred,safe(media.right+24,preferred.y),safe(preferred.x,media.bottom+24),safe(media.left-sw-24,preferred.y),safe(preferred.x,media.top-sh-24)];
   const clear=p=>!board.visible||p.x+sw+12<media.left||p.x>media.right+12||p.y+sh+12<media.top||p.y>media.bottom+12;
   const place=candidates.find(clear)||preferred;
   const correction=new THREE.Matrix4().makeTranslation(place.x-bounds.left*fit,place.y-bounds.top*fit,0).multiply(new THREE.Matrix4().makeScale(fit,fit,1));
   matrix.premultiply(correction);
   // Normalize homogeneous coordinates for CSS and keep readable front-face semantics.
   const norm=matrix.elements[15];if(Math.abs(norm)>1e-8)matrix.multiplyScalar(1/norm);
   onFrame({planeBounds:{left:place.x,top:place.y,width:sw,height:sh},media:board.visible?media:null,source:sourceFiles[feature],caption:names[feature],matrix:matrix.elements,width,feature,reveal:current.reveal,illumination,lightAngle:Math.sin(drift*.55+current.phase)*38});
   renderer.render(scene,camera);slowFrames=late||performance.now()-frameStarted>24?slowFrames+1:0;
   const downgraded=slowFrames>=8&&budget>512;if(downgraded){budget=512;slowFrames=0;resize();}
   canvas.parentElement.classList.add('webgl-ready');dirty=settling||downgraded;
  }
  continuing=dirty;if(dirty)schedule();
  // RAF-paced, time-based passive movement; cancelled on pause, hidden tabs, Save-Data and disposal.
  if(!dirty&&!passiveTimer&&!constrained&&budget>512&&passiveAllowed){passiveTimer=setTimeout(()=>{passiveTimer=0;if(!active||disposed)return;dirty=true;schedule();},0);}

 }
 selectFeature(0);resize();const size=new ResizeObserver(resize);size.observe(canvas.parentElement);
 return{
  setPose(pose){if(!active||disposed)return;if(pose.flight>=0&&current.flight<0&&target.flight<0)current.flight=pose.flight;passiveAllowed=pose.passive!==false;if(!passiveAllowed){clearTimeout(passiveTimer);passiveTimer=0;}const index=Math.max(0,Math.min(3,Math.round(pose.feature??0)));selectFeature(index);
   let changed=target.tone!==pose.tone;for(const key of['x','y','z','energy','phase','zoom','fx','fy','fz','reveal','flight']){const value=pose[key]??(key==='zoom'?1:key==='flight'?-1:0);changed||=Math.abs(target[key]-value)>.00001;target[key]=value;}
   target.tone=pose.tone;targetColor.setHex(pose.tone);if(changed){dirty=true;schedule();}},
  setActive(value){const next=value&&!disposed;if(next===active)return;active=next;if(active){lastTime=0;continuing=false;dirty=true;schedule();}else{cancelAnimationFrame(frame);clearTimeout(passiveTimer);passiveTimer=0;frame=0;}},
  dispose(){if(disposed)return;active=false;disposed=true;clearTimeout(passiveTimer);passiveTimer=0;cancelAnimationFrame(frame);size.disconnect();
   const geometries=new Set(),materials=new Set(),textures=new Set(textureCache.values());scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
   geometries.forEach(g=>g.dispose());materials.forEach(m=>{if(m.map)textures.add(m.map);m.dispose();});textures.forEach(t=>t.dispose());renderer.dispose();canvas.parentElement.classList.remove('webgl-ready');}
 };
}


