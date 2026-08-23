import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function useClipping({ viewer, viewerRef, safeUpdate }) {
  const planes = useRef([]);
  const helpers = useRef([]);
  const selectedIdx = useRef(null);

  const [selectedPlaneIndex, setSelectedPlaneIndex] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [activeAxis, setActiveAxis] = useState("z");

  const apply = () => {
    const renderer =
      viewer.current?.context.getRenderer?.() ||
      viewer.current?.context.renderer;
    if (!renderer) return;
    renderer.clippingPlanes = enabled ? planes.current : [];
    renderer.localClippingEnabled = enabled;
    safeUpdate();
  };

  useEffect(apply, [enabled]);
  useEffect(() => {
    const container = viewerRef.current;
    if (!container || !viewerInst.current) return;

    const onDblClick = (event) => {
      try {
        const viewer = viewerInst.current;
        const scene = viewer.context.getScene?.() || viewer.context.getScene && viewer.context.getScene();
        const camera = viewer.context.getCamera?.() || viewer.context.camera;
        if (!scene || !camera) return;

        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        if (!intersects.length) return;
        let hit = intersects.find(i => !i.object.userData?.isClipHelper);
        if (!hit) hit = intersects[0];

        const point = hit.point.clone();
        const normal = faceNormalToWorld(hit.face, hit.object);

        const plane = new Plane().setFromNormalAndCoplanarPoint(normal.clone(), point.clone());
        clippingPlanesRef.current.push(plane);

        let size = 10;
        try {
          const box = new Box3().setFromObject(scene);
          const diag = box.getSize(new Vector3()).length();
          if (diag > 0) size = diag * 0.6;
        } catch {}
        const helper = createPlaneHelperMesh(normal.clone(), point.clone(), size);
        planeHelpersRef.current.push(helper);
        scene.add(helper);

        const newIndex = clippingPlanesRef.current.length - 1;
        selectedPlaneIdxRef.current = newIndex;
        setSelectedPlaneIndex(newIndex);

        applyClippingToRenderer();
      } catch (e) {
        console.warn("create clip failed:", e);
      }
    };

    container.addEventListener("dblclick", onDblClick);
    return () => container.removeEventListener("dblclick", onDblClick);
  }, [viewerRef.current, viewerInst.current, clippingEnabled]);

  useEffect(() => {
    const container = viewerRef.current;
    if (!container || !viewerInst.current) return;

    const onClick = (event) => {
      try {
        const viewer = viewerInst.current;
        const scene = viewer.context.getScene?.() || viewer.context.getScene && viewer.context.getScene();
        const camera = viewer.context.getCamera?.() || viewer.context.camera;
        if (!scene || !camera) return;

        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(planeHelpersRef.current, true);
        if (intersects.length) {
          const mesh = intersects[0].object;
          const idx = planeHelpersRef.current.findIndex(m => m === mesh || m.uuid === mesh.uuid);
          if (idx >= 0) {
            selectedPlaneIdxRef.current = idx;
            setSelectedPlaneIndex(idx);
            planeHelpersRef.current.forEach((m, i) => {
              if (m.material) m.material.opacity = i === idx ? 0.35 : 0.18;
            });
            return;
          }
        } else {
          selectedPlaneIdxRef.current = null;
          setSelectedPlaneIndex(null);
          planeHelpersRef.current.forEach((m) => { if (m.material) m.material.opacity = 0.18; });
        }
      } catch (e) {
        console.warn("pick helper failed:", e);
      }
    };

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [viewerRef.current, viewerInst.current]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const idx = selectedPlaneIdxRef.current;
      if (idx === null || typeof idx === "undefined") return;
      const plane = clippingPlanesRef.current[idx];
      const helper = planeHelpersRef.current[idx];
      if (!plane || !helper) return;

      const moveStep = e.ctrlKey ? 0.5 : 0.05;
      const sizeStep = e.ctrlKey ? 0.5 : 0.05;
      const rotStep = e.shiftKey ? 0.2 : 0.02; 

      const axisVec = activeAxis === "x" ? new Vector3(1, 0, 0) : activeAxis === "y" ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);

      let changed = false;

      if (e.code === "ArrowUp") {
        helper.position.addScaledVector(axisVec, moveStep);
        changed = true;
      } else if (e.code === "ArrowDown") {
        helper.position.addScaledVector(axisVec, -moveStep);
        changed = true;
      } else if (e.code === "ArrowRight") {
        if (e.shiftKey) {
          helper.rotateOnWorldAxis(axisVec, -rotStep);
        } else {
          const newSize = Math.max(0.1, (helper.userData.size || helper.userData.baseSize) + sizeStep);
          helper.userData.size = newSize;
          const scale = newSize / helper.userData.baseSize;
          helper.scale.set(scale, scale, scale);
        }
        changed = true;
      } else if (e.code === "ArrowLeft") {
        if (e.shiftKey) {
          helper.rotateOnWorldAxis(axisVec, rotStep);
        } else {
          const newSize = Math.max(0.1, (helper.userData.size || helper.userData.baseSize) - sizeStep);
          helper.userData.size = newSize;
          const scale = newSize / helper.userData.baseSize;
          helper.scale.set(scale, scale, scale);
        }
        changed = true;
      } else if (e.code === "Delete" || e.code === "Backspace") {
        removeSelectedPlane();
        return;
      }

      if (changed) {
        const worldQuat = helper.getWorldQuaternion(new Quaternion());
        const newNormal = new Vector3(0, 0, 1).applyQuaternion(worldQuat).normalize();
        plane.normal.copy(newNormal);
        const worldPos = helper.getWorldPosition(new Vector3());
        plane.constant = -newNormal.dot(worldPos);
        applyClippingToRenderer();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeAxis]);
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
    const quat = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal.clone().normalize());
    mesh.quaternion.copy(quat);
    mesh.position.copy(center);
    mesh.name = `plane-helper-${Date.now()}`;
    mesh.userData.isClipHelper = true;
    mesh.userData.baseSize = size;
    mesh.userData.size = size;
    return mesh;
  }
  function faceNormalToWorld(face, object) {
    if (!face || !object) return new Vector3(0, 0, 1);
    const n = new Vector3(face.normal.x, face.normal.y, face.normal.z);
    const normalMatrix = new Matrix3().getNormalMatrix(object.matrixWorld);
    n.applyMatrix3(normalMatrix).normalize();
    return n;
  }

  return {
    enabled,
    setEnabled,
    activeAxis,
    setActiveAxis,
    selectedPlaneIndex,
    removeSelectedPlane,
    clearAllPlanes,
  };
}
