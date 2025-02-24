import { createContext, useContext } from 'react';

export const ConvaiContext = createContext({
  currentAction: '',
  setCurrentAction: () => {},
});

export const useConvai = () => {
  const context = useContext(ConvaiContext);
  if (!context) {
    throw new Error('useConvai must be used within a ConvaiContextProvider');
  }
  return context;
}; 