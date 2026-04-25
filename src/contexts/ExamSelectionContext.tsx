import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ExamType = string | number | null;
export type QuestionMode = 'past_question' | 'practice' | null;

export interface SubjectQuestionCount {
  subject: string;
  questionCount: number;
}

export interface ExamSelectionState {
  examType: ExamType; // This will now be the ID
  examTypeSlug: string | null;
  flowType: 'standard' | 'departmental' | null;
  subjects: string[]; // Array of selected subjects (max 4 for JAMB)
  questionMode: QuestionMode;
  questionCounts: Record<string, number>; // Map of subject -> question count
  selectedYear: number | null; // For past questions
  timeMinutes: number | null;
}

interface ExamSelectionContextType {
  selection: ExamSelectionState;
  setExamType: (id: ExamType, slug: string, flowType: 'standard' | 'departmental') => void;
  setSubjects: (subjects: string[]) => void;
  addSubject: (subject: string) => void;
  removeSubject: (subject: string) => void;
  setQuestionMode: (mode: QuestionMode) => void;
  setQuestionCount: (subject: string, count: number) => void;
  setSelectedYear: (year: number | null) => void;
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
  examTypeSlug: null,
  flowType: null,
  subjects: [],
  questionMode: null,
  questionCounts: {},
  selectedYear: null,
  timeMinutes: null,
};

const ExamSelectionContext = createContext<ExamSelectionContextType | undefined>(undefined);

export function ExamSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<ExamSelectionState>(initialState);
  const [practiceSessions, setPracticeSessions] = useState<Record<string, number>>({});

  const setExamType = useCallback((id: ExamType, slug: string, flowType: 'standard' | 'departmental') => {
    setSelection((prev) => ({
      ...prev,
      examType: id,
      examTypeSlug: slug,
      flowType: flowType,
      // Reset subjects when exam type changes
      subjects: [],
      questionCounts: {},
    }));
  }, []);

  const setSubjects = useCallback((subjects: string[]) => {
    setSelection((prev) => {
      const maxSubjects = subjects.length > 0 && prev.examTypeSlug === 'JAMB' ? 4 : 1;
      const limitedSubjects = subjects.slice(0, maxSubjects);

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
  }, []);

  const addSubject = useCallback((subject: string) => {
    setSelection((prev) => {
      const maxSubjects = prev.examTypeSlug === 'JAMB' ? 4 : 1;

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
  }, []);

  const removeSubject = useCallback((subject: string) => {
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
  }, []);

  const setQuestionMode = useCallback((mode: QuestionMode) => {
    setSelection((prev) => ({ ...prev, questionMode: mode }));
  }, []);

  const setQuestionCount = useCallback((subject: string, count: number) => {
    setSelection((prev) => ({
      ...prev,
      questionCounts: {
        ...prev.questionCounts,
        [subject]: count,
      },
    }));
  }, []);

  const setSelectedYear = useCallback((year: number | null) => {
    setSelection((prev) => ({ ...prev, selectedYear: year }));
  }, []);

  const setTimeMinutes = useCallback((minutes: number | null) => {
    setSelection((prev) => ({ ...prev, timeMinutes: minutes }));
  }, []);

  const resetSelection = useCallback(() => {
    setSelection(initialState);
  }, []);

  const getMaxSubjects = useCallback((): number => {
    return selection.examTypeSlug === 'JAMB' ? 4 : 1;
  }, [selection.examTypeSlug]);

  const canAddMoreSubjects = useCallback((): boolean => {
    const maxSubjects = getMaxSubjects();
    return selection.subjects.length < maxSubjects;
  }, [getMaxSubjects, selection.subjects.length]);

  const getPracticeSessionCount = useCallback((subject: string): number => {
    return practiceSessions[subject] || 0;
  }, [practiceSessions]);

  const incrementPracticeSession = useCallback((subject: string) => {
    setPracticeSessions((prev) => ({
      ...prev,
      [subject]: (prev[subject] || 0) + 1,
    }));
  }, []);

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
        setSelectedYear,
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
