import React, { createContext, useContext, useState } from "react";

type PDFContextType = {
  extractedText: string;
  setExtractedText: (text: string) => void;
  quizData: any[];
  setQuizData: (data: any[]) => void;
};

const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [extractedText, setExtractedText] = useState("");
  const [quizData, setQuizData] = useState<any[]>([]);

  return (
    <PDFContext.Provider
      value={{
        extractedText,
        setExtractedText,
        quizData,
        setQuizData,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
};

export const usePDF = () => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error("usePDF must be used within a PDFProvider");
  }
  return context;
};
