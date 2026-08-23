import React from 'react';
import { safeStringify } from '../ui/utils/safeStringify';

/**
 * @param {Object|null} info
 * @param {Function} onCopy
 */
const PropertiesPanel = ({ info, onCopy }) => {
  return (
    <div style={{
      position: "absolute",
      left: 20,
      bottom: 20,
      width: 340,
      maxHeight: "45%",
      display: "flex",
      flexDirection: "column",
      background: "rgba(3, 3, 3, 0.98)",
      borderRadius: 10,
      boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
      overflow: "hidden",
      zIndex: 36
    }}>
      <div style={{ padding: 10, background: "#fafafa", borderBottom: "1px solid #eee", color: "#000" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <strong>Свойства</strong>
          <div style={{ display: "flex", gap: 6 }}>
            {info?.id && (
              <button 
                onClick={() => onCopy(info)}
                style={{ cursor: 'pointer', padding: '2px 8px' }}
              >
                JSON
              </button>
            )}
          </div>
        </div>
        <pre style={{ 
          fontSize: 11, 
          whiteSpace: "pre-wrap", 
          border: "1px solid #ddd", 
          padding: 6, 
          borderRadius: 4, 
          maxHeight: 200, 
          overflow: "auto", 
          color: "#000",
          background: '#fff',
          margin: 0
        }}>
          {info ? safeStringify(info) : "Выберите элемент"}
        </pre>
      </div>
    </div>
  );
};

export default PropertiesPanel;