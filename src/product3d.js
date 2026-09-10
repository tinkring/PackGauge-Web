import frontMesh from './mesh-front.js';
import rearMesh from './mesh-rear.js';
import adapterMesh from './mesh-adapter.js';

const PACKGAUGE_MESHES = { front: frontMesh, rear: rearMesh, adapter: adapterMesh };

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const decode = (value, Type) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Type(bytes.buffer);
};

const meshFromData = (THREE, data, material) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(decode(data.positions, Float32Array), 3));
  geometry.setIndex(new THREE.BufferAttribute(decode(data.indices, Uint16Array), 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const buildPackGauge = async (THREE) => {
  const group = new THREE.Group();
  group.name = 'PackGauge';

  const black = new THREE.MeshPhysicalMaterial({
    color: 0x111216,
    roughness: 0.43,
    metalness: 0.04,
    clearcoat: 0.25,
    clearcoatRoughness: 0.38,
  });
  const red = new THREE.MeshPhysicalMaterial({
    color: 0xe21b2a,
    roughness: 0.4,
    metalness: 0.0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
  });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc8cbd0, roughness: 0.18, metalness: 0.92 });

  const front = meshFromData(THREE, PACKGAUGE_MESHES.front, black);
  group.add(front);

  const rear = meshFromData(THREE, PACKGAUGE_MESHES.rear, black);
  rear.position.z = -6.895;
  group.add(rear);

  const adapter = meshFromData(THREE, PACKGAUGE_MESHES.adapter, red);
  adapter.applyMatrix4(new THREE.Matrix4().set(
    1, 0, 0, -27,
    0, 0, -1, 27.5,
    0, -1, 0, -9.77,
    0, 0, 0, 1,
  ));
  group.add(adapter);

  // Sanitized PackGauge interface, mapped directly onto the physical screen.
  const texture = await new THREE.TextureLoader().loadAsync('./renders/screen-live.svg');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(60.4, 40.2),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  screen.position.set(-1.7, 0.35, 4.08);
  group.add(screen);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(60.9, 40.7),
    new THREE.MeshPhysicalMaterial({
      color: 0x131720,
      transparent: true,
      opacity: 0.12,
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      depthWrite: false,
    }),
  );
  glass.position.set(-1.7, 0.35, 4.16);
  group.add(glass);

  // Four actual battery contacts: two, a center gap, then two.
  [-13.8, -7.4, 7.4, 13.8].forEach((offset) => {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 8.1, 1.15), metal);
    pin.position.set(6 + offset, -17.15, -36.05);
    pin.castShadow = true;
    group.add(pin);
  });

  // Rear fasteners.
  const screwGeometry = new THREE.CylinderGeometry(2.0, 2.0, 0.82, 24);
  screwGeometry.rotateX(Math.PI / 2);
  [[-40.8, -22.2], [-40.8, 22.2], [40.8, -22.2], [40.8, 22.2]].forEach(([x, y]) => {
    const screw = new THREE.Mesh(screwGeometry, metal);
    screw.position.set(x, y, -10.16);
    screw.castShadow = true;
    group.add(screw);
  });

  // The real prototype's small exposed wire bundle is tucked along the red/black seam,
  // not routed into a fake port in the black enclosure.
  const wireColors = [0xd31b27, 0xe3ad25, 0x2f67db, 0x17181b];
  wireColors.forEach((color, index) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-26.2, -6.5 + index * 0.7, -11.2),
      new THREE.Vector3(-29.8, -7.0 + index * 0.7, -13.2),
      new THREE.Vector3(-31.4, -7.2 + index * 0.7, -16.4),
      new THREE.Vector3(-31.1, -7.4 + index * 0.7, -19.0),
    ]);
    const wire = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, 0.38, 7, false),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0 }),
    );
    wire.castShadow = true;
    group.add(wire);
  });

  return group;
};

const addLights = (THREE, scene) => {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x15151b, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(80, 110, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8ea6c9, 1.15);
  fill.position.set(-90, 30, 65);
  scene.add(fill);
  const rim = new THREE.PointLight(0xed1c24, 10, 260, 2);
  rim.position.set(35, 30, -100);
  scene.add(rim);
};

const initViewer = async (THREE, root) => {
  const canvas = root.querySelector('canvas');
  const loading = root.querySelector('[data-viewer-loading]');
  const mode = root.dataset.packgaugeViewer;
  const interactive = mode === 'hero';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  addLights(THREE, scene);

  const product = await buildPackGauge(THREE);
  scene.add(product);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 180),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: interactive ? 0.27 : 0.22 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -31.5;
  floor.position.z = -12;
  floor.receiveShadow = true;
  scene.add(floor);

  const camera = new THREE.PerspectiveCamera(interactive ? 27 : 25, 1, 0.1, 1000);
  const cameraTarget = new THREE.Vector3(0, 0, -13);
  if (interactive) camera.position.set(118, 70, 142);
  else camera.position.set(125, 76, 145);
  camera.lookAt(cameraTarget);

  if (!interactive) {
    product.rotation.x = -0.12;
    product.rotation.y = -0.52;
  }

  let drag = false;
  let lastX = 0;
  let lastY = 0;
  let resumeAt = 0;
  let paused = reducedMotion.matches;
  const pauseButton = root.querySelector('[data-rotation-toggle]');

  const syncPauseLabel = () => {
    if (!pauseButton) return;
    pauseButton.textContent = paused ? 'Resume rotation' : 'Pause rotation';
    pauseButton.setAttribute('aria-pressed', String(paused));
  };
  syncPauseLabel();

  pauseButton?.addEventListener('click', () => {
    paused = !paused;
    resumeAt = 0;
    syncPauseLabel();
  });

  if (interactive) {
    canvas.addEventListener('pointerdown', (event) => {
      drag = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      root.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      product.rotation.y += dx * 0.008;
      product.rotation.x = THREE.MathUtils.clamp(product.rotation.x + dy * 0.004, -0.32, 0.3);
      lastX = event.clientX;
      lastY = event.clientY;
    });
    const release = (event) => {
      if (!drag) return;
      drag = false;
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      root.classList.remove('is-dragging');
      resumeAt = performance.now() + 3200;
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    reducedMotion.addEventListener?.('change', (event) => {
      paused = event.matches;
      syncPauseLabel();
    });
  }

  const resize = () => {
    const { width, height } = root.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(root);
  resize();

  loading?.classList.add('is-hidden');
  root.classList.add('is-ready');

  let previous = performance.now();
  const render = (now) => {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (interactive && !drag && !paused && (!resumeAt || now > resumeAt)) product.rotation.y += dt * 0.28;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
};

const boot = async () => {
  const roots = [...document.querySelectorAll('[data-packgauge-viewer]')];
  if (!roots.length) return;
  try {
    const THREE = await import(/* @vite-ignore */ THREE_URL);
    await Promise.all(roots.map((root) => initViewer(THREE, root)));
  } catch (error) {
    console.error('PackGauge 3D viewer failed to start', error);
    roots.forEach((root) => root.classList.add('viewer-failed'));
  }
};

boot();
