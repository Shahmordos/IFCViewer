import * as THREE from "three";

export const createCustomPlaneHelper = (normal, point, size, isActive = false) => {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({
    color: isActive ? 0x00ff00 : 0x3a86ff, // Зеленый если выбран, синий если нет
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(point);
  
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), 
    normal
  );
  mesh.quaternion.copy(quaternion);

  // Рамка среза
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges, 
    new THREE.LineBasicMaterial({ color: isActive ? 0x00ff00 : 0x3a86ff, transparent: true, opacity: 0.6 })
  );
  mesh.add(line);

  mesh.userData = { isClipHelper: true };
  return mesh;
};

export const getFaceNormal = (face, object) => {
  if (!face) return new THREE.Vector3(0, 0, 1);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
  return face.normal.clone().applyMatrix3(normalMatrix).normalize();
};