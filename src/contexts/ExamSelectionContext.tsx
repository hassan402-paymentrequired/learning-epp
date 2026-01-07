import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ExamType = 'JAMB' | 'DLI' | null;
export type QuestionMode = 'past_question' | 'practice' | null;

export interface SubjectQuestionCount {
  subject: string;
  questionCount: number;
}

export interface ExamSelectionState {
  examType: ExamType;
  subjects: string[]; // Array of selected subjects (max 4 for JAMB)
  questionMode: QuestionMode;
  questionCounts: Record<string, number>; // Map of subject -> question count
  timeMinutes: number | null;
}

interface ExamSelectionContextType {
  selection: ExamSelectionState;
  setExamType: (type: ExamType) => void;
  setSubjects: (subjects: string[]) => void;
  addSubject: (subject: string) => void;
  removeSubject: (subject: string) => void;
  setQuestionMode: (mode: QuestionMode) => void;
  setQuestionCount: (subject: string, count: number) => void;
  setTimeMinutes: (minutes: number | null) => void;
  resetSelection: () => void;
  // Practice session tracking
  getPracticeSessionCount: (subject: string) => number;
  incrementPracticeSession: (subject: string) => void;
  // Helper methods
  getMaxSubjects: () => number; // Returns max subjects allowed (4 for JAMB, 1 for DLI)
  canAddMoreSubjects: () => boolean;
}

const initialState: ExamSelectionState = {
  examType: null,
  subjects: [],
  questionMode: null,
  questionCounts: {},
  timeMinutes: null,
};

const ExamSelectionContext = createContext<ExamSelectionContextType | undefined>(undefined);

export function ExamSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<ExamSelectionState>(initialState);
  const [practiceSessions, setPracticeSessions] = useState<Record<string, number>>({});

  const setExamType = (type: ExamType) => {
    setSelection((prev) => ({ 
      ...prev, 
      examType: type,
      // Reset subjects when exam type changes
      subjects: [],
      questionCounts: {},
    }));
  };

  const setSubjects = (subjects: string[]) => {
    const maxSubjects = subjects.length > 0 && selection.examType === 'JAMB' ? 4 : 1;
    const limitedSubjects = subjects.slice(0, maxSubjects);
    
    setSelection((prev) => {
      // Remove question counts for subjects that are no longer selected
      const newQuestionCounts = { ...prev.questionCounts };
      prev.subjects.forEach((subject) => {
        if (!limitedSubjects.includes(subject)) {
          delete newQuestionCounts[subject];
        }
      });
      
      return { 
        ...prev, 
        subjects: limitedSubjects,
        questionCounts: newQuestionCounts,
      };
    });
  };

  const addSubject = (subject: string) => {
    const maxSubjects = selection.examType === 'JAMB' ? 4 : 1;
    
    setSelection((prev) => {
      if (prev.subjects.includes(subject)) {
        return prev; // Already selected
      }
      
      if (prev.subjects.length >= maxSubjects) {
        return prev; // Max subjects reached
      }
      
      return {
        ...prev,
        subjects: [...prev.subjects, subject],
      };
    });
  };

  const removeSubject = (subject: string) => {
    setSelection((prev) => {
      const newSubjects = prev.subjects.filter((s) => s !== subject);
      const newQuestionCounts = { ...prev.questionCounts };
      delete newQuestionCounts[subject];
      
      return {
        ...prev,
        subjects: newSubjects,
        questionCounts: newQuestionCounts,
      };
    });
  };

  const setQuestionMode = (mode: QuestionMode) => {
    setSelection((prev) => ({ ...prev, questionMode: mode }));
  };

  const setQuestionCount = (subject: string, count: number) => {
    setSelection((prev) => ({
      ...prev,
      questionCounts: {
        ...prev.questionCounts,
        [subject]: count,
      },
    }));
  };

  const setTimeMinutes = (minutes: number | null) => {
    setSelection((prev) => ({ ...prev, timeMinutes: minutes }));
  };

  const resetSelection = () => {
    setSelection(initialState);
  };

  const getMaxSubjects = (): number => {
    return selection.examType === 'JAMB' ? 4 : 1;
  };

  const canAddMoreSubjects = (): boolean => {
    const maxSubjects = getMaxSubjects();
    return selection.subjects.length < maxSubjects;
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
        setSubjects,
        addSubject,
        removeSubject,
        setQuestionMode,
        setQuestionCount,
        setTimeMinutes,
        resetSelection,
        getPracticeSessionCount,
        incrementPracticeSession,
        getMaxSubjects,
        canAddMoreSubjects,
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
