import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Color, Plane, Vector3, Box3, Raycaster, Vector2 } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

import { useKeyboard } from "./components/IfcViewer/hooks/useKeyboard";
import { createCustomPlaneHelper, getFaceNormal } from "./components/ui/utils/clippingLogic";
import { TreeItem } from "./components/IfcViewer/TreeItem";

const API_BASE = `${process.env.REACT_APP_API_URL}/api`; 

const DARK_THEME = {
  bg: "#0d0d0d",
  sidebar: "#141414",
  panel: "#1c1c1c",
  accent: "#3a86ff",
  border: "#2a2a2a",
  text: "#e0e0e0",
  textDim: "#666",
  danger: "#ff4d4d"
};

const LIGHT_THEME = {
  bg: "#f0f2f5",
  sidebar: "#ffffff",
  panel: "#e4e6eb",
  accent: "#0062ff",
  border: "#dcdfe6",
  text: "#1c1e21",
  textDim: "#8e9297",
  danger: "#fa3e3e"
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState("");

  const viewerRef = useRef(null);
  const viewerInst = useRef(null);
  const clippingPlanesRef = useRef([]);
  const planeHelpersRef = useRef([]);
  const selectedPlaneIdxRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeAxis, setActiveAxis] = useState("z");
  const [tree, setTree] = useState(null);
  const [properties, setProperties] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [planesList, setPlanesList] = useState([]); 
  const [selectedPlaneIndex, setSelectedPlaneIndex] = useState(null);
  const [serverFiles, setServerFiles] = useState([]);
  const [isServerLoading, setIsServerLoading] = useState(false);

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`
  }), [token]);

  const clearModels = async () => {
    if (!viewerInst.current) return;
    try {
      await viewerInst.current.IFC.selector.unpickIfcItems();
      
      const models = Object.values(viewerInst.current.IFC.context.items.ifcModels);
      for (const model of models) {
        await viewerInst.current.IFC.removeModel(model.modelID);
      }

      setTree(null);
      setProperties(null);
      setSelectedId(null);
      
    
      clippingPlanesRef.current = [];
      planeHelpersRef.current.forEach(h => viewerInst.current.context.getScene().remove(h));
      planeHelpersRef.current = [];
      setPlanesList([]);
    } catch (e) {
      console.warn("Ошибка при очистке сцены:", e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const response = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("access_token", data.access);
        setToken(data.access);
      } else {
        setAuthError("Неверные данные для входа");
      }
    } catch (err) {
      setAuthError("Ошибка соединения с сервером");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    window.location.reload(); 
  };

  const refreshFileList = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/files/`, {
        headers: getAuthHeaders()
      });
      if (response.status === 401) return handleLogout();
      const data = await response.json();
      setServerFiles(data);
    } catch (e) {
      console.error("Ошибка при получении списка файлов:", e);
    }
  };

  useEffect(() => {
    if (token) refreshFileList();
  }, [token]);

  const loadFileFromServer = async (filename) => {
    if (!viewerInst.current || !token) return;
    setIsServerLoading(true);
    try {
      await clearModels();
      
      const fileUrl = `${API_BASE}/file/${filename}/`;
      const response = await fetch(fileUrl, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error("Доступ запрещен");
      
      const blob = await response.blob();
      const file = new File([blob], filename);
      
      const model = await viewerInst.current.IFC.loadIfc(file, true);
      const spatialTree = await viewerInst.current.IFC.getSpatialStructure(model.modelID);
      setTree(spatialTree);
    } catch (e) {
      console.error("Ошибка загрузки модели:", e);
      alert("Не удалось загрузить модель.");
    } finally {
      setIsServerLoading(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file || !token) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    try {
      const response = await fetch(`${API_BASE}/upload/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (response.ok) {
        refreshFileList();
      }
    } catch (e) {
      console.error("Ошибка загрузки:", e);
    }
  };

  const deleteFile = async (filename) => {
    if (!window.confirm(`Удалить ${filename}?`) || !token) return;
    try {
      await fetch(`${API_BASE}/delete/${filename}/`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
      refreshFileList();
    } catch (e) {
      console.error("Ошибка при удалении:", e);
    }
  };

  useEffect(() => {
    if (viewerInst.current && viewerInst.current.context) {
      const scene = viewerInst.current.context.getScene();
      const renderer = viewerInst.current.context.getRenderer();
      const color = new Color(theme.bg);
      if (scene) scene.background = color;
      if (renderer) renderer.setClearColor(color);
    }
  }, [isDarkMode]);

  useEffect(() => {
    selectedPlaneIdxRef.current = selectedPlaneIndex;
    planeHelpersRef.current.forEach((helper, idx) => {
      const isSelected = idx === selectedPlaneIndex;
      if (helper.material) {
        helper.material.color.setHex(isSelected ? 0x00ff00 : 0x3a86ff);
        helper.material.opacity = isSelected ? 0.15 : 0.03; 
        if (helper.children[0] && helper.children[0].material) {
          helper.children[0].material.opacity = isSelected ? 0.3 : 0.01;
        }
      }
    });
  }, [selectedPlaneIndex]);

  const applyClipping = () => {
    if (!viewerInst.current) return;
    const renderer = viewerInst.current.context.getRenderer();
    if (renderer) {
      renderer.clippingPlanes = clippingPlanesRef.current;
      renderer.localClippingEnabled = true;
    }
  };

  const removeSelectedPlane = (idxToRemove = null) => {
    const idx = idxToRemove !== null ? idxToRemove : selectedPlaneIdxRef.current;
    if (idx === null || idx === undefined || !viewerInst.current) return;
    const scene = viewerInst.current.context.getScene();
    if (planeHelpersRef.current[idx]) scene.remove(planeHelpersRef.current[idx]);
    clippingPlanesRef.current.splice(idx, 1);
    planeHelpersRef.current.splice(idx, 1);
    setPlanesList([...clippingPlanesRef.current]);
    setSelectedPlaneIndex(null);
    applyClipping();
  };

  useKeyboard(activeAxis, selectedPlaneIdxRef, clippingPlanesRef, planeHelpersRef, removeSelectedPlane, applyClipping);

  const handleSelectElement = async (id) => {
    if (!viewerInst.current || id === null) return;
    setSelectedId(id);
    await viewerInst.current.IFC.selector.pickIfcItemsByID(0, [id]);
    const props = await viewerInst.current.IFC.getProperties(0, id, true, false);
    setProperties(props);
  };

  useEffect(() => {
    if (!token || !viewerRef.current || viewerInst.current) return;

    const container = viewerRef.current;
    const viewer = new IfcViewerAPI({ 
      container: container, 
      backgroundColor: new Color(theme.bg) 
    });
    
    viewer.IFC.setWasmPath("/wasm/");
    viewer.axes.setAxes();
    viewer.grid.setGrid();
    viewerInst.current = viewer;

    const handleDblClick = (event) => {
      const scene = viewer.context.getScene();
      const camera = viewer.context.getCamera();
      const rect = container.getBoundingClientRect();
      const mouse = new Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObjects(scene.children, true)
        .find(i => !i.object.userData?.isClipHelper && i.face);

      if (hit) {
        const normal = getFaceNormal(hit.face, hit.object);
        const plane = new Plane().setFromNormalAndCoplanarPoint(normal, hit.point);
        const box = new Box3().setFromObject(scene);
        const size = box.getSize(new Vector3()).length() * 0.5 || 10;
        const helper = createCustomPlaneHelper(normal, hit.point, size);
        clippingPlanesRef.current.push(plane);
        planeHelpersRef.current.push(helper);
        scene.add(helper);
        setPlanesList([...clippingPlanesRef.current]);
        setSelectedPlaneIndex(clippingPlanesRef.current.length - 1);
        applyClipping();
      }
    };

    const handleMouseClick = async () => {
      const result = await viewer.IFC.selector.pickIfcItem(true);
      if (result) handleSelectElement(result.id);
      else {
        viewer.IFC.selector.unpickIfcItems();
        setSelectedId(null);
        setProperties(null);
      }
    };

    container.addEventListener("dblclick", handleDblClick);
    container.addEventListener("click", handleMouseClick);

    return () => {
      container.removeEventListener("dblclick", handleDblClick);
      container.removeEventListener("click", handleMouseClick);
      viewer.dispose();
      viewerInst.current = null;
      if (container) container.innerHTML = "";
    };
  }, [token]); 

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && viewerInst.current) {
      await clearModels(); 
      const model = await viewerInst.current.IFC.loadIfc(file, true);
      const spatialTree = await viewerInst.current.IFC.getSpatialStructure(model.modelID);
      setTree(spatialTree);
      if (window.confirm("Файл открыт. Сохранить в ваше облако?")) uploadFile(file);
    }
  };

  if (!token) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: theme.sidebar, padding: "40px", borderRadius: "12px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: "15px", width: "320px" }}>
          <h2 style={{ color: theme.accent, textAlign: 'center', margin: '0 0 10px 0' }}>IFC LOGIN</h2>
          {authError && <p style={{ color: theme.danger, fontSize: "12px", textAlign: 'center' }}>{authError}</p>}
          <input 
            type="text" 
            placeholder="Логин" 
            style={{ padding: "12px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: theme.panel, color: theme.text }}
            onChange={e => setCredentials({...credentials, username: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            style={{ padding: "12px", borderRadius: "6px", border: `1px solid ${theme.border}`, background: theme.panel, color: theme.text }}
            onChange={e => setCredentials({...credentials, password: e.target.value})}
          />
          <button type="submit" style={{ padding: "12px", borderRadius: "6px", border: "none", background: theme.accent, color: "#fff", fontWeight: "bold", cursor: "pointer" }}>ВОЙТИ</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", background: theme.bg, color: theme.text, fontFamily: 'sans-serif', transition: 'background 0.3s' }}>
      
      <aside style={{ width: "320px", background: theme.sidebar, borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", zIndex: 10 }}>
        <div style={{ padding: "20px", borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="file" accept=".ifc" onChange={onFileChange} style={{ flex: 1, fontSize: "11px" }} />
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: theme.panel, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: '6px', cursor: 'pointer', padding: '4px 8px' }}>
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={handleLogout} title="Выйти" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>🚪</button>
        </div>

        <div style={{ padding: "15px", borderBottom: `1px solid ${theme.border}`, background: isDarkMode ? "#00000033" : "#ffffff33" }}>
          <h4 style={{ fontSize: "10px", textTransform: "uppercase", color: theme.accent, margin: "0 0 10px 0", letterSpacing: '1px' }}>
             {isServerLoading ? "Загрузка..." : "Мои облачные модели"}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
            {serverFiles.map((f, i) => (
              <div key={i} onClick={() => loadFileFromServer(f.filename)} style={{ fontSize: '11px', padding: '6px 10px', background: theme.panel, borderRadius: '6px', cursor: 'pointer', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteFile(f.filename); }} style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
              </div>
            ))}
            {serverFiles.length === 0 && <p style={{ fontSize: '10px', color: theme.textDim, textAlign: 'center' }}>Нет файлов</p>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: theme.accent, padding: "0 10px", letterSpacing: '1px' }}>Дерево проекта</h4>
          {tree && <TreeItem node={tree} onSelect={handleSelectElement} selectedId={selectedId} />}
        </div>

        <div style={{ height: "240px", borderTop: `1px solid ${theme.border}`, padding: "15px", background: theme.sidebar }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
             <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: theme.accent, margin: 0 }}>Срезы</h4>
             {selectedPlaneIndex !== null && (
               <button onClick={() => setSelectedPlaneIndex(null)} style={{ background: theme.accent, color: '#fff', border: 'none', fontSize: '9px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>СНЯТЬ ВЫДЕЛЕНИЕ</button>
             )}
          </div>
          <div style={{ overflowY: "auto", height: "150px" }}>
            {planesList.map((_, idx) => (
              <div key={idx} onClick={() => setSelectedPlaneIndex(idx)} style={{ padding: "8px 12px", borderRadius: "6px", marginBottom: "4px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "12px", background: selectedPlaneIndex === idx ? `${theme.accent}33` : theme.panel, border: `1px solid ${selectedPlaneIndex === idx ? theme.accent : "transparent"}`, color: theme.text }}>
                <span>Срез #{idx + 1}</span>
                <button onClick={(e) => { e.stopPropagation(); removeSelectedPlane(idx); }} style={{ marginLeft: "auto", background: "none", border: "none", color: theme.danger, cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", bottom: 25, left: "50%", transform: "translateX(-50%)", background: theme.sidebar + "CC", backdropFilter: "blur(8px)", padding: "10px 25px", borderRadius: "100px", border: `1px solid ${theme.border}`, display: "flex", gap: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.15)", zIndex: 20 }}>
          {['x','y','z'].map(a => (
            <button key={a} onClick={() => setActiveAxis(a)} style={{ background: activeAxis === a ? theme.accent : theme.panel, border: "none", color: activeAxis === a ? "#fff" : theme.text, width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "11px", fontWeight: 'bold' }}>{a.toUpperCase()}</button>
          ))}
        </div>
      </main>

      <aside style={{ width: "350px", background: theme.sidebar, borderLeft: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", zIndex: 10 }}>
        <div style={{ padding: "20px", borderBottom: `1px solid ${theme.border}` }}>
          <h4 style={{ fontSize: "11px", textTransform: "uppercase", color: theme.accent, margin: 0 }}>Свойства</h4>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {properties ? (
            <pre style={{ fontSize: "11px", whiteSpace: "pre-wrap", background: theme.panel, padding: "15px", borderRadius: "8px", color: theme.text, border: `1px solid ${theme.border}` }}>
              {JSON.stringify(properties, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2)}
            </pre>
          ) : (
            <p style={{ fontSize: "12px", color: theme.textDim, textAlign: "center", marginTop: "50px" }}>Выберите элемент</p>
          )}
        </div>
      </aside>
    </div>
  );
}