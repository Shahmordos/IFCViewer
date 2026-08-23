import React from 'react';

/**
 * @param {Object} node
 * @param {Set} hiddenItems 
 * @param {Function} onToggleHidden 
 * @param {Function} onHighlight 
 * @param {number|null} selectedId 
 */
const TreeNode = ({ node, hiddenItems, onToggleHidden, onHighlight, selectedId }) => {
  const isHidden = hiddenItems.has(Number(node.id));
  const isSelected = selectedId === node.id;

  return (
    <li 
      data-id={node.id} 
      style={{ 
        listStyle: "none", 
        margin: "2px 0", 
        opacity: isHidden ? 0.5 : 1 
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleHidden(node.id); }} 
          style={{ 
            cursor: "pointer", 
            background: "none", 
            border: "1px solid #ccc", 
            borderRadius: "3px", 
            padding: "0 4px",
            lineHeight: '18px'
          }}
        >
          {isHidden ? "🚫" : "👁"}
        </button>
        <span 
          onClick={async (e) => { e.stopPropagation(); await onHighlight(node.id); }} 
          style={{ 
            cursor: "pointer", 
            fontSize: "13px", 
            color: isSelected ? "#007bff" : "#333", 
            fontWeight: isSelected ? "bold" : "normal",
            padding: "2px 4px",
            borderRadius: "4px",
            background: isSelected ? "#e7f3ff" : "transparent"
          }}
        >
          {node.name} <small style={{ color: "#888" }}>({node.id})</small>
        </span>
      </div>
      
      {node.children?.length > 0 && (
        <ul style={{ 
          paddingLeft: "15px", 
          borderLeft: "1px solid #eee", 
          marginTop: "2px" 
        }}>
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              hiddenItems={hiddenItems}
              onToggleHidden={onToggleHidden}
              onHighlight={onHighlight}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default TreeNode;