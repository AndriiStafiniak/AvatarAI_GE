import React, { createContext, useState, useContext, useEffect } from 'react';

const SceneContext = createContext();

export function SceneProvider({ children }) {
  const [currentScene, setCurrentScene] = useState("TRANSFORMACJA ENERGETYCZNA");
  
  useEffect(() => {
  }, [currentScene]);

  const setSceneWithLog = (newScene) => {
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
  return context;
} 