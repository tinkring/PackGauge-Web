import './product3d.css';
import { createRenderLoop } from './viewer-loop.js';
import { scheduleViewerStart } from './viewer-autostart.js';
import frontMesh from './mesh-front.js';
import rearMesh from './mesh-rear.js';
import adapterMesh from './mesh-adapter.js';

const PACKGAUGE_MESHES = { front: frontMesh, rear: rearMesh, adapter: adapterMesh };

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
    roughness: 0.5,
    metalness: 0.02,
    clearcoat: 0.2,
    clearcoatRoughness: 0.46,
    side: THREE.DoubleSide,
  });
  const red = new THREE.MeshPhysicalMaterial({
    color: 0xe21b2a,
    roughness: 0.46,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.55,
    side: THREE.DoubleSide,
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

  // The adapter is offset on the rear of the black enclosure, not centered.
  // IMPORTANT: the large open construction/cavity face of the printed adapter mounts
  // against the black enclosure. The finished battery-contact pocket faces outward.
  // The transformed near face is held just behind the rear housing so the parts butt
  // together without intersecting.
  const adapterLeftX = -45.7 + (0.2605 * 25.4); // -39.0833 mm
  const adapterCenterX = adapterLeftX + 33.0;
  const adapter = meshFromData(THREE, PACKGAUGE_MESHES.adapter, red);
  adapter.applyMatrix4(new THREE.Matrix4().set(
    1, 0, 0, adapterLeftX,
    0, 0, -1, 27.5,
    0, 1, 0, -35.79,
    0, 0, 0, 1,
  ));
  group.add(adapter);

  // Oversize the display layers slightly behind the bezel. The bezel itself masks
  // the excess, which eliminates the exposed cavity/void along the top edge.
  const screenBack = new THREE.Mesh(
    new THREE.PlaneGeometry(66.8, 48.0),
    new THREE.MeshStandardMaterial({
      color: 0x07080a,
      roughness: 0.72,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  screenBack.position.set(-1.7, 1.95, 4.045);
  group.add(screenBack);

  const texture = await new THREE.TextureLoader().loadAsync('./renders/screen-live.svg');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(66.0, 47.0),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide }),
  );
  screen.position.set(-1.7, 1.95, 4.085);
  group.add(screen);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(66.3, 47.3),
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
  glass.position.set(-1.7, 1.95, 4.165);
  group.add(glass);

  // Four flat spring contacts inside the outward-facing battery pocket.
  // Tightened toward the center of the red tongue and recessed slightly so the
  // blades are visibly inset from the tongue edges, with only a short exposed tip.
  // Arrangement stays two contacts, center gap, two contacts.
  [-10.8, -5.2, 5.2, 10.8].forEach((offset) => {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 5.6, 5.2), metal);
    pin.position.set(adapterCenterX + offset, -13.8, -33.55);
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

const disposeScene = (scene) => {
  const textures = new Set();
  const materials = new Set();
  const geometries = new Set();
  scene.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    for (const material of [node.material].flat().filter(Boolean)) {
      materials.add(material);
      if (material.map) textures.add(material.map);
    }
    node.shadow?.map?.dispose();
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
};

const initViewer = async (THREE, root, onFailure) => {
  const stage = root.querySelector('.viewer-stage');
  const canvas = root.querySelector('canvas');
  const status = root.querySelector('[data-viewer-status]');
  const interactive = root.dataset.packgaugeViewer === 'hero';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  addLights(THREE, scene);
  let product;
  try {
    product = await buildPackGauge(THREE);
    scene.add(product);
  } catch (error) {
    disposeScene(scene);
    renderer.dispose();
    throw error;
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 180), new THREE.ShadowMaterial({ color: 0, opacity: interactive ? 0.27 : 0.22 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -31.5, -12);
  floor.receiveShadow = true;
  scene.add(floor);
  const camera = new THREE.PerspectiveCamera(interactive ? 27 : 23, 1, 0.1, 1000);
  const initialRotation = interactive ? [-0.06, -0.34, 0] : [-0.025, -0.08, 0];
  product.rotation.set(...initialRotation);
  camera.position.set(...(interactive ? [118, 70, 142] : [122, 58, 202]));
  camera.lookAt(new THREE.Vector3(0, interactive ? 0 : -1.5, interactive ? -13 : -8));
  let paused = reducedMotion.matches;
  let drag = false;
  let lastX = 0;
  let lastY = 0;
  let shown = false;
  let pageActive = true;
  const bounds = stage.getBoundingClientRect();
  let inViewport = bounds.bottom > 0 && bounds.top < window.innerHeight;
  const events = new AbortController();
  const options = { signal: events.signal };
  const pauseButton = root.querySelector('[data-rotation-toggle]');
  const loop = createRenderLoop({ draw: (_now, dt) => {
    if (interactive && !paused && !drag) product.rotation.y += dt * 0.22;
    try {
      renderer.render(scene, camera);
    } catch (error) {
      cleanup();
      onFailure();
      return;
    }
    if (!shown) {
      shown = true;
      root.classList.add('is-ready');
      const controls = root.querySelector('.viewer-controls');
      if (controls) controls.hidden = false;
      const loadButton = root.querySelector('[data-load-viewer]');
      const moveFocus = document.activeElement === loadButton;
      loadButton.hidden = true;
      if (moveFocus) {
        const focusTarget = controls?.querySelector('button') ?? root;
        if (focusTarget === root) root.tabIndex = -1;
        focusTarget.focus({ preventScroll: true });
      }
      status.textContent = interactive ? 'Drag sideways to rotate, or use the buttons.' : '';
    }
  } });
  const syncRotation = () => {
    if (pauseButton) {
      pauseButton.textContent = paused ? 'Resume rotation' : 'Pause rotation';
    }
    loop.setContinuous(interactive && !paused && !drag);
  };
  const pauseRotation = () => { paused = true; syncRotation(); };
  pauseButton?.addEventListener('click', () => { paused = !paused; syncRotation(); }, options);
  root.querySelectorAll('[data-turn]').forEach((button) => {
    button.addEventListener('click', () => {
      pauseRotation();
      product.rotation.y += button.dataset.turn === 'left' ? -Math.PI / 8 : Math.PI / 8;
      loop.invalidate();
    }, options);
  });
  root.querySelector('[data-reset-view]')?.addEventListener('click', () => {
    pauseRotation();
    product.rotation.set(...initialRotation);
    loop.invalidate();
  }, options);
  if (interactive) {
    canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      drag = true;
      pauseRotation();
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      root.classList.add('is-dragging');
    }, options);
    canvas.addEventListener('pointermove', (event) => {
      if (!drag) return;
      product.rotation.y += (event.clientX - lastX) * 0.008;
      if (event.pointerType !== 'touch') product.rotation.x = THREE.MathUtils.clamp(product.rotation.x + (event.clientY - lastY) * 0.004, -0.28, 0.24);
      lastX = event.clientX;
      lastY = event.clientY;
      loop.invalidate();
    }, options);
    const release = (event) => {
      drag = false;
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      root.classList.remove('is-dragging');
    };
    canvas.addEventListener('pointerup', release, options);
    canvas.addEventListener('pointercancel', release, options);
    reducedMotion.addEventListener('change', (event) => { if (event.matches) pauseRotation(); }, options);
  }
  const syncVisibility = () => loop.setActive(inViewport && !document.hidden && pageActive);
  const visibility = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    syncVisibility();
  });
  visibility.observe(stage);
  document.addEventListener('visibilitychange', syncVisibility, options);
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    loop.invalidate();
  };
  const dimensions = new ResizeObserver(resize);
  dimensions.observe(stage);
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    loop.dispose();
    visibility.disconnect();
    dimensions.disconnect();
    events.abort();
    disposeScene(scene);
    renderer.dispose();
  };
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    cleanup();
    onFailure();
  }, options);
  window.addEventListener('pagehide', (event) => {
    pageActive = false;
    syncVisibility();
    if (!event.persisted) cleanup();
  }, options);
  window.addEventListener('pageshow', () => { pageActive = true; syncVisibility(); }, options);
  canvas.hidden = false;
  resize();
  syncRotation();
  syncVisibility();
  return cleanup;
};

// Vite serves this separate chunk from the same site, without a runtime CDN.
let threePromise;
const loadThree = () => {
  if (!threePromise) threePromise = import('./three-viewer.js').catch((error) => {
    threePromise = undefined;
    throw error;
  });
  return threePromise;
};
for (const root of document.querySelectorAll('[data-packgauge-viewer]')) {
  const button = root.querySelector('[data-load-viewer]');
  const status = root.querySelector('[data-viewer-status]');
  let cleanup;
  let loading = false;
  let cancelAutomatic = () => {};
  if (!button || !status) continue;
  button.hidden = false;
  const failure = () => {
    root.classList.remove('is-ready', 'is-dragging');
    const controls = root.querySelector('.viewer-controls');
    if (controls) controls.hidden = true;
    root.querySelector('canvas').hidden = true;
    button.hidden = false;
    button.textContent = 'Try 3D again';
    status.textContent = '3D could not open here. You can still use the screen gallery.';
  };
  const startViewer = async (automatic = false) => {
    if (loading) return;
    loading = true;
    button.disabled = true;
    root.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading 3D…';
    let deadline;
    try {
      cleanup?.();
      cleanup = undefined;
      const oldCanvas = root.querySelector('canvas');
      const canvas = document.createElement('canvas');
      canvas.hidden = true;
      canvas.setAttribute('aria-hidden', 'true');
      oldCanvas.replaceWith(canvas);
      const THREE = await Promise.race([
        loadThree(),
        new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('3D download timed out')), 15000); }),
      ]);
      cleanup = await initViewer(THREE, root, failure);
    } catch (error) {
      failure();
      if (automatic) {
        button.textContent = 'Explore in 3D';
        status.textContent = 'Showing the still preview. You can try 3D with the button.';
      }
      console.warn('PackGauge 3D preview unavailable', error);
    } finally {
      clearTimeout(deadline);
      loading = false;
      button.disabled = false;
      root.removeAttribute('aria-busy');
    }
  };
  button.addEventListener('click', () => {
    cancelAutomatic();
    startViewer();
  });
  if (root.dataset.packgaugeViewer === 'hero') {
    cancelAutomatic = scheduleViewerStart(root, () => startViewer(true));
  }
}
