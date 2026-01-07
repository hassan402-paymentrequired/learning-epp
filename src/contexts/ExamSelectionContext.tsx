import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ExamType = 'JAMB' | 'DLI' | null;
export type QuestionMode = 'past_question' | 'practice' | null;

export interface ExamSelectionState {
  examType: ExamType;
  subject: string | null;
  questionMode: QuestionMode;
  questionCount: number | null;
  timeMinutes: number | null;
}

interface ExamSelectionContextType {
  selection: ExamSelectionState;
  setExamType: (type: ExamType) => void;
  setSubject: (subject: string | null) => void;
  setQuestionMode: (mode: QuestionMode) => void;
  setQuestionCount: (count: number | null) => void;
  setTimeMinutes: (minutes: number | null) => void;
  resetSelection: () => void;
  // Practice session tracking
  getPracticeSessionCount: (subject: string) => number;
  incrementPracticeSession: (subject: string) => void;
}

const initialState: ExamSelectionState = {
  examType: null,
  subject: null,
  questionMode: null,
  questionCount: null,
  timeMinutes: null,
};

const ExamSelectionContext = createContext<ExamSelectionContextType | undefined>(undefined);

export function ExamSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<ExamSelectionState>(initialState);
  const [practiceSessions, setPracticeSessions] = useState<Record<string, number>>({});

  const setExamType = (type: ExamType) => {
    setSelection((prev) => ({ ...prev, examType: type }));
  };

  const setSubject = (subject: string | null) => {
    setSelection((prev) => ({ ...prev, subject }));
  };

  const setQuestionMode = (mode: QuestionMode) => {
    setSelection((prev) => ({ ...prev, questionMode: mode }));
  };

  const setQuestionCount = (count: number | null) => {
    setSelection((prev) => ({ ...prev, questionCount: count }));
  };

  const setTimeMinutes = (minutes: number | null) => {
    setSelection((prev) => ({ ...prev, timeMinutes: minutes }));
  };

  const resetSelection = () => {
    setSelection(initialState);
  };

  const getPracticeSessionCount = (subject: string): number => {
    return practiceSessions[subject] || 0;
  };

  const incrementPracticeSession = (subject: string) => {
    setPracticeSessions((prev) => ({
      ...prev,
      [subject]: (prev[subject] || 0) + 1,
    }));
  };

  return (
    <ExamSelectionContext.Provider
      value={{
        selection,
        setExamType,
        setSubject,
        setQuestionMode,
        setQuestionCount,
        setTimeMinutes,
        resetSelection,
        getPracticeSessionCount,
        incrementPracticeSession,
      }}
    >
      {children}
    </ExamSelectionContext.Provider>
  );
}

export function useExamSelection() {
  const context = useContext(ExamSelectionContext);
  if (context === undefined) {
    throw new Error('useExamSelection must be used within an ExamSelectionProvider');
  }
  return context;
}
