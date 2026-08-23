import { useEffect } from "react";
import { Vector3, Quaternion } from "three";

export const useKeyboard = (
  activeAxis,
  selectedPlaneIdxRef,
  clippingPlanesRef,
  planeHelpersRef,
  removeSelectedPlane,
  applyClippingToRenderer
) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      const idx = selectedPlaneIdxRef.current;
      if (idx === null || typeof idx === "undefined") return;

      const plane = clippingPlanesRef.current[idx];
      const helper = planeHelpersRef.current[idx];
      if (!plane || !helper) return;

      const moveStep = e.ctrlKey ? 0.5 : 0.05;
      const rotStep = e.shiftKey ? 0.1 : 0.02;
      const axisVec = new Vector3(
        activeAxis === "x" ? 1 : 0,
        activeAxis === "y" ? 1 : 0,
        activeAxis === "z" ? 1 : 0
      );

      let changed = false;
      if (e.code === "ArrowUp" || e.code === "ArrowRight") {
        if (!e.shiftKey) {
          helper.position.addScaledVector(axisVec, moveStep);
          changed = true;
        }
      } 
      else if (e.code === "ArrowDown" || e.code === "ArrowLeft") {
        if (!e.shiftKey) {
          helper.position.addScaledVector(axisVec, -moveStep);
          changed = true;
        }
      }
      if (e.shiftKey) {
        if (e.code === "ArrowRight") {
          helper.rotateOnWorldAxis(axisVec, rotStep);
          changed = true;
        } else if (e.code === "ArrowLeft") {
          helper.rotateOnWorldAxis(axisVec, -rotStep);
          changed = true;
        }
      }
      if (e.code === "Delete" || e.code === "Backspace") {
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
  }, [activeAxis, removeSelectedPlane, applyClippingToRenderer]);
};