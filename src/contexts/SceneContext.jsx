import React, { createContext, useState, useContext, useEffect } from 'react';

const SceneContext = createContext();

export function SceneProvider({ children }) {
  const [currentScene, setCurrentScene] = useState("TRANSFORMACJA ENERGETYCZNA");
  
  useEffect(() => {
    console.log("SceneContext - currentScene zmienione na:", currentScene);
  }, [currentScene]);

  const setSceneWithLog = (newScene) => {
    console.log("setCurrentScene wywoływane z:", newScene);
    setCurrentScene(newScene);
  };

  return (
    <SceneContext.Provider value={{ 
      currentScene, 
      setCurrentScene: setSceneWithLog 
    }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    console.error("useScene musi być używany wewnątrz SceneProvider!");
  }
  return context;
} 