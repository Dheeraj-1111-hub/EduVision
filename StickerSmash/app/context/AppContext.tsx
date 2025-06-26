// context/AppContext.tsx
import React, { createContext, useState } from "react";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type AppContextType = {
  quizData: QuizQuestion[];
  setQuizData: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
  summary: string;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
  pdfId: string | null;
  setPdfId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const AuthContext = createContext<AppContextType>({
  quizData: [],
  setQuizData: () => {},
  summary: "",
  setSummary: () => {},
  pdfId: null,
  setPdfId: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [pdfId, setPdfId] = useState<string | null>(null);

  return (
    <AuthContext.Provider
      value={{
        quizData,
        setQuizData,
        summary,
        setSummary,
        pdfId,
        setPdfId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
