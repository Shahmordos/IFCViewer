import React from 'react';

import { useIfcViewer } from './useIfcViewer';
import { useIfcModel } from './useIfcModel';
import { useClipping } from './useClipping';
import { useVisibility } from './useVisibility';
import { useKeyboard } from './hooks/useKeyboard';
import Loader from '../shared/Loader';
import TreePanel from '../shared/TreePanel';
import PropertiesPanel from '../shared/PropertiesPanel';
import ClippingControls from '../shared/ClippingControls';

export default function IfcViewer() {
  const { viewerRef, viewerInst, safeUpdate } = useIfcViewer();
  const { 
    tree, 
    info, 
    currentModelID, 
    onFileChange, 
    highlightObject, 
    loadingText, 
    loaderVisible,
    setInfo 
  } = useIfcModel(viewerInst);
  const {
    clippingEnabled,
    setClippingEnabled,
    activeAxis,
    setActiveAxis,
    selectedPlaneIndex,
    removeSelectedPlane,
    clearAllPlanes
  } = useClipping(viewerInst, viewerRef, safeUpdate);

  const { 
    hiddenItems, 
    toggleHidden, 
    showAllHidden 
  } = useVisibility(viewerInst, currentModelID, safeUpdate);

  useKeyboard({
    selectedPlaneIndex,
    activeAxis,
    removeSelectedPlane,
  });

  const onCopyProps = (data) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Скопировано в буфер обмена");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", backgroundColor: "#f4f4f4", overflow: "hidden" }}>
    
      <div style={{ padding: "10px 20px", background: "#fff", borderBottom: "1px solid #ddd", display: "flex", gap: "15px", alignItems: "center", zIndex: 30 }}>
        <input 
          id="file-input" 
          type="file" 
          accept=".ifc" 
          onChange={(e) => onFileChange(e.target.files?.[0])} 
        />
        
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setClippingEnabled(!clippingEnabled)}>
            {clippingEnabled ? "Откл. срезы" : "Вкл. срезы"}
          </button>
          <button onClick={showAllHidden}>Показать всё</button>
          <button onClick={removeSelectedPlane} disabled={selectedPlaneIndex === null}>Удалить срез</button>
          <button onClick={clearAllPlanes}>Очистить срезы</button>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>

        <div style={{ flex: 1, position: "relative", background: "#eee" }}>
          <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />

          <ClippingControls 
            activeAxis={activeAxis} 
            setActiveAxis={setActiveAxis} 
            selectedPlaneIndex={selectedPlaneIndex} 
          />
        </div>

        <TreePanel 
          tree={tree} 
          hiddenItems={hiddenItems} 
          onToggleHidden={toggleHidden} 
          onHighlight={highlightObject}
          selectedId={info?.id}
        />

        <PropertiesPanel 
          info={info} 
          onCopy={onCopyProps} 
        />
      </div>

      <Loader visible={loaderVisible} text={loadingText} />
    </div>
  );
}