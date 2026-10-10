const stage = document.getElementById('pokeball-field');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

async function startScene() {
  if (!stage || motionQuery.matches || !document.createElement('canvas').getContext('webgl')) {
    return;
  }

  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js');
  } catch {
    return;
  }

  if (motionQuery.matches || !stage.isConnected) {
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.pointerEvents = 'none';
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 14;
  scene.add(new THREE.AmbientLight(0xffffff, 1.35));
  const light = new THREE.DirectionalLight(0xe6ffff, 2.4);
  light.position.set(-3, 8, 12);
  scene.add(light);

  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xf34d63, metalness: 0.05, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: 0xe4faff, metalness: 0.06, roughness: 0.38 }),
    new THREE.MeshStandardMaterial({ color: 0x183950, metalness: 0.1, roughness: 0.56 }),
    new THREE.MeshStandardMaterial({ color: 0x85cde5, metalness: 0.3, roughness: 0.28 })
  ];
  const geometries = [];

  function mesh(geometry, material, parent, position) {
    geometries.push(geometry);
    const item = new THREE.Mesh(geometry, material);
    if (position) {
      item.position.set(...position);
    }
    parent.add(item);
    return item;
  }

  function pokeball() {
    const group = new THREE.Group();
    mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), materials[0], group);
    mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), materials[1], group);
    mesh(new THREE.CylinderGeometry(1.004, 1.004, .135, 28), materials[2], group);
    mesh(new THREE.CircleGeometry(.27, 28), materials[2], group, [0, 0, 1.015]);
    mesh(new THREE.CircleGeometry(.18, 28), materials[3], group, [0, 0, 1.025]);
    mesh(new THREE.CircleGeometry(.11, 28), materials[1], group, [0, 0, 1.035]);
    scene.add(group);
    return group;
  }

  const balls = [
    { object: pokeball(), radius: 1.4, side: -.4, y: 1.7, speed: .43, phase: .2 },
    { object: pokeball(), radius: 1.1, side: .43, y: -1.8, speed: .36, phase: 2.4 },
    { object: pokeball(), radius: .65, side: .23, y: 3, speed: .5, phase: 4.2 }
  ];
  let raf = 0;
  let stopped = false;
  let pointerX = 0;
  let pointerY = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;
  const clock = new THREE.Clock();

  function resize() {
    viewportWidth = Math.max(1, stage.clientWidth);
    viewportHeight = Math.max(1, stage.clientHeight);
    camera.aspect = viewportWidth / viewportHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportWidth, viewportHeight, false);
  }

  function draw() {
    if (stopped || document.hidden || motionQuery.matches) {
      raf = 0;
      return;
    }

    const time = clock.getElapsedTime();
    const viewWidth = 2 * Math.tan((camera.fov * Math.PI) / 360) * 15 * camera.aspect;

    for (const ball of balls) {
      const item = ball.object;
      item.scale.setScalar(ball.radius);
      item.position.x = viewWidth * ball.side + Math.sin(time * ball.speed + ball.phase) * .35 + pointerX * .16;
      item.position.y = ball.y + Math.sin(time * ball.speed * 1.35 + ball.phase) * .45 + pointerY * .12;
      item.position.z = -2.8;
      item.rotation.y = time * ball.speed * .42;
      item.rotation.z = Math.sin(time * ball.speed + ball.phase) * .22;
    }

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(draw);
  }

  function onPointerMove(event) {
    pointerX = (event.clientX / Math.max(window.innerWidth, 1) - .5) * 2;
    pointerY = (.5 - event.clientY / Math.max(window.innerHeight, 1)) * 2;
  }

  function onVisibility() {
    if (!document.hidden && !raf && !stopped) {
      clock.start();
      raf = window.requestAnimationFrame(draw);
    }
  }

  function dispose() {
    if (stopped) {
      return;
    }
    stopped = true;
    window.cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pagehide', dispose);
    document.removeEventListener('visibilitychange', onVisibility);
    motionQuery.removeEventListener('change', onMotionChange);
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  }

  function onMotionChange() {
    if (motionQuery.matches) {
      dispose();
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pagehide', dispose, { once: true });
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', onMotionChange);
  resize();
  draw();
}

if (document.readyState === 'complete') {
  void startScene();
} else {
  window.addEventListener('load', () => void startScene(), { once: true });
}
