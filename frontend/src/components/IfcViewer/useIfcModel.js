import { useState } from "react";

export const useIfcModel = (viewerInst) => {
  const [tree, setTree] = useState(null);
  const [info, setInfo] = useState(null);
  const [currentModelID, setCurrentModelID] = useState(null);
  const [loadingText, setLoadingText] = useState("");
  const [loaderVisible, setLoaderVisible] = useState(false);

  const onFileChange = async (file) => {
    if (!file || !viewerInst.current) return;
    
    setLoaderVisible(true);
    setLoadingText("Загрузка IFC модели...");
    
    try {
      const viewer = viewerInst.current;
      const model = await viewer.IFC.loadIfc(file, true);
      setCurrentModelID(model.modelID);
       setLoadingText("Построение структуры...");
      const spatialTree = await viewer.IFC.getSpatialStructure(model.modelID);
      setTree(spatialTree);

      window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
      window.onclick = async () => {
        const result = await viewer.IFC.selector.pickIfcItem(true);
        if (!result) {
          setInfo(null);
          return;
        }
        const { modelID, id } = result;
        const props = await viewer.IFC.getProperties(modelID, id, true, false);
        setInfo(props);
      };
    } catch (error) {
      console.error("Ошибка при чтении IFC:", error);
      alert("Не удалось загрузить файл");
    } finally {
      setLoaderVisible(false);
    }
  };

  const highlightObject = async (id) => {
    if (currentModelID === null || !viewerInst.current) return;
    const viewer = viewerInst.current;
    await viewer.IFC.selector.pickIfcItemsByID(currentModelID, [id], true);
    const props = await viewer.IFC.getProperties(currentModelID, id, true, false);
    setInfo(props);
  };

  return {
    tree,
    info,
    currentModelID,
    onFileChange,
    highlightObject,
    loadingText,
    loaderVisible,
    setInfo
  };
};