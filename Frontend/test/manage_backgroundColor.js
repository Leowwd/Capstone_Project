import React, { createContext, useState } from "react";

export const manage_backgroundColor = createContext();

export const BackgroundColorProvider = ({ children }) => {
  const [isWhite, setIsWhite] = useState(true);
  const [fontSize, setFontSize] = useState(20);

  const toggleBackgroundColor = () => {
    setIsWhite(!isWhite);
  };

  const increaseFontSize = () => {
    setFontSize((prevSize) => prevSize + 2);
  };

  const decreaseFontSize = () => {
    setFontSize((prevSize) => Math.max(10, prevSize - 2));
  };

  return (
    <manage_backgroundColor.Provider
      value={{
        isWhite,
        toggleBackgroundColor,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
      }}
    >
      {children}
    </manage_backgroundColor.Provider>
  );
};
