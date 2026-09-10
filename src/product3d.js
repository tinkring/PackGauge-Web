import './product3d.css';
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

  // These are source-derived printable meshes. Double-sided, flat-shaded
  // materials avoid false holes and melted-looking normals in the browser.
  const black = new THREE.MeshPhysicalMaterial({
    color: 0x111216,
    roughness: 0.5,
    metalness: 0.02,
    clearcoat: 0.2,
    clearcoatRoughness: 0.46,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const red = new THREE.MeshPhysicalMaterial({
    color: 0xe21b2a,
    roughness: 0.46,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.55,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xe7e9ed,
    roughness: 0.22,
    metalness: 0.72,
  });

  const front = meshFromData(THREE, PACKGAUGE_MESHES.front, black);
  group.add(front);

  const rear = meshFromData(THREE, PACKGAUGE_MESHES.rear, black);
  rear.position.z = -6.895;
  group.add(rear);

  // Black case width is 91.4 mm; the measured adapter left offset is 0.2605 in.
  const adapterLeftX = -45.7 + (0.2605 * 25.4); // -39.0833 mm
  const adapter = meshFromData(THREE, PACKGAUGE_MESHES.adapter, red);
  adapter.applyMatrix4(new THREE.Matrix4().set(
    1, 0, 0, adapterLeftX,
    0, 0, -1, 27.5,
    0, 1, 0, -32.95,
    0, 0, 0, 1,
  ));
  group.add(adapter);

  // Fill the physical LCD opening instead of leaving a visible moat around it.
  const screenBack = new THREE.Mesh(
    new THREE.PlaneGeometry(66.5, 44.5),
    new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.72, metalness: 0, side: THREE.DoubleSide }),
  );
  screenBack.position.set(-1.7, 0.35, 4.045);
  group.add(screenBack);

  const texture = await new THREE.TextureLoader().loadAsync('./renders/screen-live.svg');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(65.7, 43.8),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide }),
  );
  screen.position.set(-1.7, 0.35, 4.085);
  group.add(screen);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(66.0, 44.0),
    new THREE.MeshPhysicalMaterial({
      color: 0x131720,
      transparent: true,
      opacity: 0.1,
      roughness: 0.05,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.set(-1.7, 0.35, 4.165);
  group.add(glass);

  // The real contacts are short flat spring blades inside the red battery pocket.
  // They emerge from the central red body and sit close to it rather than hanging
  // from the outer edge. Four blades, with the larger center gap visible.
  const bladeX = adapterLeftX + 22.1;
  const bladeY = [6.4, 2.0, -5.8, -10.2];
  bladeY.forEach((y) => {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.82, 1.18), metal);
    pin.position.set(bladeX, y, -19.2);
    pin.castShadow = true;
    group.add(pin);
  });

  const screwGeometry = new THREE.CylinderGeometry(2, 2, 0.82, 24);
  screwGeometry.rotateX(Math.PI / 2);
  [[-40.8, -22.2], [-40.8, 22.2], [40.8, -22.2], [40.8, 22.2]].forEach(([x, y]) => {
    const screw = new THREE.Mesh(screwGeometry, metal);
    screw.position.set(x, y, -10.16);
    screw.castShadow = true;
    group.add(screw);
  });

  // Wire routing is intentionally omitted until its final path is locked down.

  return group;
};

const addLights = (THREE, scene) => {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x15151b, 1.75));

  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(90, 110, 135);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9cb2d4, 1.35);
  fill.position.set(-95, 35, 80);
  scene.add(fill);

  const rearFill = new THREE.DirectionalLight(0xffffff, 1.15);
  rearFill.position.set(-25, 50, -150);
  scene.add(rearFill);

  const rim = new THREE.PointLight(0xed1c24, 6.5, 260, 2);
  rim.position.set(45, 35, -105);
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
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  addLights(THREE, scene);
  const product = await buildPackGauge(THREE);
  scene.add(product);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 180),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: interactive ? 0.24 : 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -31.5;
  floor.position.z = -12;
  floor.receiveShadow = true;
  scene.add(floor);

  const camera = new THREE.PerspectiveCamera(interactive ? 27 : 23, 1, 0.1, 1000);
  const cameraTarget = new THREE.Vector3(0, interactive ? 0 : -1.5, interactive ? -13 : -8);
  if (interactive) {
    camera.position.set(118, 70, 142);
    product.rotation.set(-0.06, -0.34, 0);
  } else {
    camera.position.set(122, 58, 202);
    product.rotation.set(-0.025, -0.08, 0);
  }
  camera.lookAt(cameraTarget);

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
      product.rotation.y += (event.clientX - lastX) * 0.008;
      product.rotation.x = THREE.MathUtils.clamp(product.rotation.x + (event.clientY - lastY) * 0.004, -0.28, 0.24);
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
    if (interactive && !drag && !paused && (!resumeAt || now > resumeAt)) product.rotation.y += dt * 0.22;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
};

const create = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const makeFallback = (alt) => {
  const image = create('img', 'viewer-fallback');
  image.src = './renders/hero-reader.webp';
  image.alt = alt;
  image.width = 520;
  image.height = 347;
  return image;
};

const upgradeProductPresentation = () => {
  const originalHero = document.querySelector('.hero-product.render-hero');
  if (originalHero) {
    const viewer = create('div', 'hero-product-3d');
    viewer.dataset.packgaugeViewer = 'hero';
    viewer.setAttribute('aria-label', 'Interactive 3D view of the PackGauge standalone reader');
    const index = create('div', 'viewer-index');
    index.append(create('strong', '', 'PACKGAUGE / INTERACTIVE 3D'), create('span', '', '01'));
    const stage = create('div', 'viewer-stage');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const loading = create('span', 'viewer-loading', 'Building PackGauge in 3D');
    loading.dataset.viewerLoading = '';
    stage.append(canvas, loading, makeFallback('Rendered PackGauge standalone diagnostic reader'));
    const controls = create('div', 'viewer-controls');
    controls.append(create('span', '', 'Drag to rotate'));
    const toggle = create('button', 'rotation-toggle', 'Pause rotation');
    toggle.type = 'button';
    toggle.dataset.rotationToggle = '';
    toggle.setAttribute('aria-pressed', 'false');
    controls.append(toggle);
    viewer.append(index, stage, controls);
    originalHero.replaceWith(viewer);
  }

  const originalReader = document.querySelector('#reader .hardware-detail.render-detail');
  if (originalReader) {
    const figure = create('figure', 'reader-visual-3d');
    const stage = create('div', 'reader-iso-stage');
    stage.dataset.packgaugeViewer = 'static';
    stage.setAttribute('aria-label', 'Isometric 3D view of the PackGauge standalone reader');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const loading = create('span', 'viewer-loading', 'Rendering PackGauge');
    loading.dataset.viewerLoading = '';
    stage.append(canvas, loading, makeFallback('Rendered PackGauge standalone diagnostic reader'));
    const caption = document.createElement('figcaption');
    caption.append(
      create('span', '', 'THE READER / STANDALONE'),
      create('strong', '', 'One model. Every angle.'),
      create('p', '', 'Source-derived 3D geometry from the current prototype, rendered directly in the browser.'),
    );
    figure.append(stage, caption);
    originalReader.replaceWith(figure);
  }
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

upgradeProductPresentation();
boot();
