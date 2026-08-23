import React from 'react';
import TreeNode from './TreeNode';

/**
 * @param {Object} tree
 * @param {Set} hiddenItems
 * @param {Function} onToggleHidden
 * @param {Function} onHighlight
 * @param {number|null} selectedId
 */
const TreePanel = ({ tree, hiddenItems, onToggleHidden, onHighlight, selectedId }) => {
  return (
    <div style={{
      position: "absolute",
      right: 20,
      top: 20,
      width: 360,
      height: "calc(100% - 40px)",
      background: "rgba(255,255,255,0.98)",
      borderRadius: 10,
      boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
      zIndex: 45,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      <div id="tree-container" style={{ flex: 1, overflowY: "auto", padding: 12, borderBottom: "1px solid #eee" }}>
        <h4 style={{ margin: "0 0 8px 0" }}>Дерево элементов</h4>
        {tree ? (
          <ul style={{ paddingLeft: 0 }}>
            <TreeNode 
              node={tree} 
              hiddenItems={hiddenItems}
              onToggleHidden={onToggleHidden}
              onHighlight={onHighlight}
              selectedId={selectedId}
            />
          </ul>
        ) : (
          <div style={{ color: "#777", textAlign: 'center', marginTop: 20 }}>
            Файл не выбран
          </div>
        )}
      </div>

      <div style={{ padding: 12, background: '#fcfcfc' }}>
        <strong>Интерактив</strong>
        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          Выделите элемент в сцене или в дереве, затем смотрите его свойства.
        </div>
      </div>
    </div>
  );
};

export default TreePanel;