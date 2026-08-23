import React, { useState, useEffect } from 'react';

export const TreeItem = ({ node, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(true); 
  const hasChildren = node.children && node.children.length > 0;

  const isSelected = node.expressID === selectedId;

  useEffect(() => {
    if (selectedId && hasChildren) {
      const isChildSelected = (nodes) => {
        return nodes.some(n => n.expressID === selectedId || (n.children && isChildSelected(n.children)));
      };
      if (isChildSelected(node.children)) setExpanded(true);
    }
  }, [selectedId, node.children, hasChildren]);

  return (
    <div style={{ marginLeft: 10, fontFamily: 'sans-serif' }}>
      <div 
        style={{ 
          cursor: 'pointer', 
          padding: '4px 8px', 
          borderRadius: '4px',
          backgroundColor: isSelected ? '#3a86ff44' : 'transparent',
          color: isSelected ? '#3a86ff' : '#ccc',
          display: 'flex',
          alignItems: 'center'
        }}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded); 
          onSelect(node.expressID); 
        }}
      >
        <span style={{ width: '15px' }}>{hasChildren ? (expanded ? "▼" : "▶") : "○"}</span>
        <span>{node.type}</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#555' }}>{node.expressID}</span>
      </div>
      
      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px solid #2a2a2a', marginLeft: '7px' }}>
          {node.children.map((child) => (
            <TreeItem 
              key={child.expressID} 
              node={child} 
              onSelect={onSelect} 
              selectedId={selectedId} 
            />
          ))}
        </div>
      )}
    </div>
  );
};