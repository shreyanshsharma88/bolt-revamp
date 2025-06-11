import { useEffect, useState } from "react";

export const useTypedText = (text: string, speed = 20) => {
    const [displayed, setDisplayed] = useState("");
  
    useEffect(() => {
      if (!text) {
        setDisplayed("");
        return;
      }
  
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed((prev) => prev + text[i]);
        i++;
        if (i >= text.length) clearInterval(interval);
      }, speed);
  
      return () => clearInterval(interval);
    }, [text]);
  
    return displayed;
  };