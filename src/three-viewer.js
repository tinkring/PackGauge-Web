// Export only the pieces used by this viewer so Vite can omit other features.
export {
  ACESFilmicToneMapping, BoxGeometry, BufferAttribute, BufferGeometry,
  CylinderGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight,
  MathUtils, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry,
  PointLight, Scene, ShadowMaterial, SRGBColorSpace, TextureLoader, Vector3,
  WebGLRenderer,
} from 'three';
