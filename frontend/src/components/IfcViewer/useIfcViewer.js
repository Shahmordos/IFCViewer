import { useEffect, useRef } from "react";
import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";


export function useIfcViewer() {
const viewerRef = useRef(null);
const viewer = useRef(null);


useEffect(() => {
if (!viewerRef.current) return;


const v = new IfcViewerAPI({
container: viewerRef.current,
backgroundColor: new Color(0xffffff),
});


try {
v.IFC.loader.ifcManager.setWasmPath("/wasm/");
} catch (e) {
try { v.IFC.setWasmPath && v.IFC.setWasmPath("/"); } catch {}
}


v.axes.setAxes();
v.grid.setGrid();


const renderer = v.context.getRenderer?.() || v.context.renderer;
if (renderer) renderer.localClippingEnabled = true;


viewer.current = v;
window.viewer = v;


const mm = () => v.IFC.selector.prePickIfcItem?.();
window.addEventListener("mousemove", mm);


return () => {
window.removeEventListener("mousemove", mm);
try { v.dispose?.(); } catch {}
};
}, []);


const safeUpdate = () => {
if (!viewer.current) return;
const ctx = viewer.current.context;
if (!ctx) return;
if (ctx.update) ctx.update();
else if (ctx.requestRender) ctx.requestRender();
else if (ctx.getRenderer && ctx.getRenderer().render)
ctx.getRenderer().render(ctx.getScene(), ctx.getCamera?.());
};


return { viewerRef, viewer, safeUpdate };
}