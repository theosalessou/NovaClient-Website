import * as THREE from './assets/vendor/three.module.js';

// A bounded, demand-rendered hero. There is no idle animation or page-wide canvas.
export function createEmblem(canvas) {
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 30);
  camera.position.z = 13;
  const group = new THREE.Group();
  scene.add(group);

  const shape = new THREE.Shape();
  shape.moveTo(0, 2.7);
  shape.bezierCurveTo(.22, .8, .8, .28, 2.7, 0);
  shape.bezierCurveTo(.8, -.24, .22, -.8, 0, -2.7);
  shape.bezierCurveTo(-.22, -.8, -.8, -.24, -2.7, 0);
  shape.bezierCurveTo(-.8, .28, -.22, .8, 0, 2.7);
  const hole = new THREE.Path();
  hole.moveTo(0, 1.42);
  hole.bezierCurveTo(-.12, .4, -.4, .12, -1.42, 0);
  hole.bezierCurveTo(-.4, -.12, -.12, -.4, 0, -1.42);
  hole.bezierCurveTo(.12, -.4, .4, -.12, 1.42, 0);
  hole.bezierCurveTo(.4, .12, .12, .4, 0, 1.42);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .64, bevelEnabled: true, bevelThickness: .2,
    bevelSize: .065, bevelSegments: 3, curveSegments: 24
  });
  geometry.center();
  // Preserve the purple machined surface without environment-map generation.
  const material = new THREE.MeshPhongMaterial({
    color: 0x9462cf, specular: 0xd8baff, shininess: 75, emissive: 0x190529
  });
  const star = new THREE.Mesh(geometry, material);
  group.add(star);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, .085, 8, 72), material);
  ring.rotation.set(.55, .3, -.65);
  ring.scale.set(1.12, .57, 1);
  group.add(ring);
  const rimMaterial = new THREE.LineBasicMaterial({ color: 0xba83f0, transparent: true, opacity: .2 });
  star.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 40), rimMaterial));
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xa567ed, transparent: true, opacity: .48 });
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.85, .024, 6, 72), orbitMaterial);
  orbit.rotation.set(-.65, .65, .35);
  group.add(orbit);
  scene.add(new THREE.HemisphereLight(0xd8c9ff, 0x170324, 2));
  for (const [color, intensity, x, y, z] of [[0xffffff, 3, -3, 4, 4], [0xb16aff, 2, 4, -1, 3]]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }

  let active = false, disposed = false, frame = 0, dirty = true;
  let targetX = .12, targetY = -.3, rx = .12, ry = -.3, lastTime = 0;
  let pointer = null, lastX = 0, lastY = 0;
  function schedule() {
    if (active && !disposed && !frame) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const width = Math.max(1, wrap.clientWidth), height = Math.max(1, wrap.clientHeight);
    // Cap backing pixels independently of the display's DPR or ultrawide width.
    const scale = Math.min(1, 640 / width, 480 / height);
    renderer.setSize(Math.round(width * scale), Math.round(height * scale), false);
    camera.aspect = width / height;
    camera.position.z = 13 / Math.min(1, camera.aspect);
    camera.updateProjectionMatrix();
    dirty = true;
    schedule();
  }
  function draw(time) {
    frame = 0;
    if (!active || disposed) return;
    const delta = lastTime ? Math.min(.05, (time - lastTime) / 1000) : 1 / 60;
    lastTime = time;
    const ease = 1 - Math.exp(-14 * delta);
    rx += (targetX - rx) * ease;
    ry += (targetY - ry) * ease;
    const settling = Math.abs(targetX - rx) + Math.abs(targetY - ry) > .001;
    if (!settling) { rx = targetX; ry = targetY; }
    if (dirty || settling) {
      group.rotation.set(rx, ry, -.18);
      renderer.render(scene, camera);
      wrap.classList.add('webgl-ready');
      dirty = settling;
    }
    if (settling) schedule();
  }
  function move(event) {
    if (!active || event.pointerType === 'touch') return;
    if (pointer === event.pointerId) {
      targetY += (event.clientX - lastX) * .008;
      targetX = Math.max(-.7, Math.min(.7, targetX + (event.clientY - lastY) * .006));
      lastX = event.clientX; lastY = event.clientY;
    } else {
      targetY = -.3 + (event.offsetX / canvas.clientWidth - .5) * .65;
      targetX = .12 + (event.offsetY / canvas.clientHeight - .5) * .35;
    }
    dirty = true;
    schedule();
  }
  function down(event) {
    if (!active || event.pointerType === 'touch') return;
    pointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
  }
  function up(event) {
    if (pointer !== event.pointerId) return;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.classList.remove('dragging');
  }
  function leave() {
    if (pointer !== null) return;
    targetX = .12; targetY = -.3; dirty = true; schedule();
  }
  canvas.addEventListener('pointermove', move, { passive: true });
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  canvas.addEventListener('pointerleave', leave);
  const size = new ResizeObserver(resize);
  size.observe(wrap);
  resize();
  return {
    setActive(value) {
      active = value && !disposed;
      if (active) { lastTime = 0; schedule(); }
      else { cancelAnimationFrame(frame); frame = 0; pointer = null; canvas.classList.remove('dragging'); }
    },
    dispose() {
      if (disposed) return;
      active = false; disposed = true;
      cancelAnimationFrame(frame);
      size.disconnect();
      for (const [type, handler] of [['pointermove', move], ['pointerdown', down], ['pointerup', up], ['pointercancel', up], ['lostpointercapture', up], ['pointerleave', leave]]) canvas.removeEventListener(type, handler);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(value => value.dispose());
      materials.forEach(value => value.dispose());
      renderer.dispose();
      wrap.classList.remove('webgl-ready');
    }
  };
}
