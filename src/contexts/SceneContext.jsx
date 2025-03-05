import React, { createContext, useState, useContext } from 'react';

const SceneContext = createContext();

export const SceneProvider = ({ children }) => {
  const [activeScene, setActiveScene] = useState(1);
  
  return (
    <SceneContext.Provider value={{ activeScene, setActiveScene }}>
      {children}
    </SceneContext.Provider>
  );
};

export const useScene = () => useContext(SceneContext); 