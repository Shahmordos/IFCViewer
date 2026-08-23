import React from 'react';

/**
 * @param {boolean} visible - показывать или нет
 * @param {string} text - текст загрузки
 */
const Loader = ({ visible, text }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
      <div style={{
        background: "#fff",
        padding: "20px 36px",
        borderRadius: 8,
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      }}>
        <div style={{ fontSize: 22, color: '#333' }}>Ожидайте</div>
        <div style={{ fontWeight: "bold", marginTop: 10, color: '#000' }}>
          {text || "Загрузка..."}
        </div>
      </div>
    </div>
  );
};

export default Loader;