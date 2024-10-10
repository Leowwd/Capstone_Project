import React, { createContext, useState, useContext} from 'react';

export const ThresholdContext = createContext();

export const ThresholdProvider = ({ children }) => {
  const [threshold, setThreshold] = useState(0.4);  // 默認值為中級

  return (
    <ThresholdContext.Provider value={{ threshold, setThreshold }}>
      {children}
    </ThresholdContext.Provider>
  );
};

export const useThreshold = () => useContext(ThresholdContext);