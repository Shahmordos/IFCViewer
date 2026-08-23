import React from 'react';

/**
 * @param {string} activeAxis 
 * @param {Function} setActiveAxis 
 * @param {number|null} selectedPlaneIndex 
 */
const ClippingControls = ({ activeAxis, setActiveAxis, selectedPlaneIndex }) => {
  const axes = ['x', 'y', 'z'];

  return (
    <div style={{ 
      position: "absolute", 
      left: 12, 
      top: 12, 
      zIndex: 99, 
      background: "rgba(255,255,255,0.95)", 
      padding: 10, 
      borderRadius: 6, 
      fontSize: 12,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      pointerEvents: 'auto'
    }}>
      <div style={{ fontWeight: "bold", marginBottom: 6, borderBottom: '1px solid #eee', pb: 4 }}>
        Clipping — управление
      </div>
      <ul style={{ margin: '0 0 8px 0', paddingLeft: 16 }}>
        <li>Double click — создать срез</li>
        <li>Click по плоскости — выбрать</li>
        <li>ArrowUp / Down — перемещение</li>
        <li>ArrowLeft / Right — размер</li>
        <li>Shift + Arrows — вращение</li>
        <li>Ctrl — большой шаг</li>
      </ul>

      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        Ось:
        {axes.map(axis => (
          <button 
            key={axis}
            onClick={() => setActiveAxis(axis)} 
            style={{ 
              marginLeft: 4, 
              padding: '2px 8px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              backgroundColor: activeAxis === axis ? '#007bff' : '#f0f0f0',
              color: activeAxis === axis ? '#fff' : '#000',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontWeight: activeAxis === axis ? "bold" : "normal" 
            }}
          >
            {axis}
          </button>
        ))}
      </div>
      
      <div style={{ marginTop: 8, color: '#666' }}>
        Выбранный срез: <strong style={{ color: '#000' }}>{selectedPlaneIndex ?? "—"}</strong>
      </div>
    </div>
  );
};

export default ClippingControls;