export function useVisibility({ viewer, safeUpdate }) {
  const [hiddenItems, setHiddenItems] = useState(new Set());

  async function toggleHidden(id) {
    const mgr = viewerInst.current?.IFC.loader.ifcManager;
    const nodeUI = document.querySelector(`#tree-container li[data-id="${id}"]`);
    const allIDs = collectBranchIDs(nodeUI);
    if (!allIDs.length) return;

    const isCurrentlyHidden = allIDs.every(i => hiddenItems.has(i));
    const newHidden = new Set(hiddenItems);

    showLoader("Обновление видимости...");
    try {
      if (!isCurrentlyHidden) {
        allIDs.forEach(i => newHidden.add(i));
        if (mgr && typeof mgr.createSubset === "function") {
          try {
            const subset = await mgr.createSubset({
              modelID: currentModelID,
              ids: allIDs,
              removePrevious: false,
              customId: `hidden_${id}`,
              scene: viewerInst.current.context.getScene?.() || viewerInst.current.context.getScene && viewerInst.current.context.getScene(),
            });
            if (subset?.mesh) subset.mesh.visible = false;
          } catch (e) {
            if (typeof mgr.hideItems === "function") await mgr.hideItems(currentModelID, allIDs);
            else hideIDsByGeometryFallback(allIDs);
          }
        } else if (typeof mgr.hideItems === "function") {
          await mgr.hideItems(currentModelID, allIDs);
        } else {
          hideIDsByGeometryFallback(allIDs);
        }
        markBranchVisibility(nodeUI, false);
      } else {
        allIDs.forEach(i => newHidden.delete(i));
        if (mgr && typeof mgr.removeSubset === "function") {
          try {
            await mgr.removeSubset(currentModelID, `hidden_${id}`);
          } catch (e) {
            if (typeof mgr.showItems === "function") await mgr.showItems(currentModelID, allIDs);
            else showIDsByGeometryFallback(allIDs);
          }
        } else if (typeof mgr.showItems === "function") {
          await mgr.showItems(currentModelID, allIDs);
        } else {
          showIDsByGeometryFallback(allIDs);
        }
        markBranchVisibility(nodeUI, true);
      }

      setHiddenItems(newHidden);
      safeUpdate();
    } catch (err) {
      console.error("toggleHidden error:", err);
    } finally {
      hideLoader();
    }
  }

  async function showAllHidden() {
    if (currentModelID === null) {
      console.warn("Сначала загрузите модель.");
      return;
    }
    const mgr = viewerInst.current.IFC.loader.ifcManager;
    showLoader("Показ всех скрытых элементов...");
    try {
      if (mgr && typeof mgr.removeSubset === "function") {
        const subs = mgr.subsets?.[currentModelID] ?? {};
        for (const key of Object.keys(subs)) {
          if (key.startsWith("hidden_")) {
            try { await mgr.removeSubset(currentModelID, key); } catch {}
          }
        }
      }
      if (typeof mgr.showItems === "function") {
        const ids = Array.from(hiddenItems).map(Number);
        if (ids.length) await mgr.showItems(currentModelID, ids);
      } else {
        showIDsByGeometryFallback(Array.from(hiddenItems));
      }
      setHiddenItems(new Set());
      document.querySelectorAll("#tree-container li").forEach((li) => {
        li.style.opacity = "1";
        const btn = li.querySelector("button");
        if (btn) btn.textContent = "скрыто";
      });
      safeUpdate();
    } catch (err) {
      console.error("showAllHidden error:", err);
    } finally {
      hideLoader();
    }
  }


  return { hiddenItems, toggleHidden, showAllHidden };
}
