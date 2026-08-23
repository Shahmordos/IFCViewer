function faceNormalToWorld(face, object) {
    if (!face || !object) return new Vector3(0, 0, 1);
    const n = new Vector3(face.normal.x, face.normal.y, face.normal.z);
    const normalMatrix = new Matrix3().getNormalMatrix(object.matrixWorld);
    n.applyMatrix3(normalMatrix).normalize();
    return n;
  }
  function createPlaneHelperMesh(normal, center, size = 10, color = 0xffb84d, opacity = 0.25) {
      const geom = new PlaneGeometry(size, size);
      const mat = new MeshStandardMaterial({
        color,
        side: DoubleSide,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geom, mat);
      // orient helper so its local +Z matches plane normal
      const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal.clone().normalize());
      mesh.quaternion.copy(quat);
      mesh.position.copy(center);
      mesh.name = `plane-helper-${Date.now()}`;
      mesh.userData.isClipHelper = true;
      // store base size so we can scale easily
      mesh.userData.baseSize = size;
      mesh.userData.size = size;
      return mesh;
    }
     function disposeHelperMesh(mesh) {
    try {
      mesh.geometry?.dispose?.();
    } catch {}
    try {
      mesh.material?.dispose?.();
    } catch {}
  }