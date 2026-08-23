import React from 'react';

export const ClippingPanel = ({ planes, selectedIdx, onSelect, onDelete, theme }) => {
  return (
    <div style={{ marginTop: '20px', borderTop: `1px solid ${theme.border}`, paddingTop: '15px' }}>
      <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: theme.accent, marginBottom: '10px' }}>
        Clipping Planes ({planes.length})
      </h3>
      {planes.length === 0 && <p style={{ fontSize: '11px', color: '#555' }}>Double click model to add</p>}
      {planes.map((_, idx) => (
        <div 
          key={idx}
          onClick={() => onSelect(idx)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            marginBottom: '5px',
            borderRadius: '6px',
            background: selectedIdx === idx ? '#3a86ff22' : theme.panel,
            border: `1px solid ${selectedIdx === idx ? theme.accent : 'transparent'}`,
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <span style={{ color: selectedIdx === idx ? theme.accent : '#fff' }}>Plane {idx + 1}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(idx); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};