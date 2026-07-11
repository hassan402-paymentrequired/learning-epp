export type ExamFlowType = 'standard' | 'departmental';
export type QuestionMode = 'past_question' | 'practice';

/** Public API identifier — never the internal database id. */
export type PublicUuid = string;

export interface ExamCategory {
  uuid: PublicUuid;
  name: string;
  slug: string;
  description: string;
  flow_type: ExamFlowType;
  is_active: boolean;
}

export interface Department {
  uuid: PublicUuid;
  name: string;
  slug: string;
  description?: string;
  subjects_count?: number;
}

export interface Answer {
  uuid: PublicUuid;
  answer_text: string;
  order: string;
}

export interface Question {
  uuid: PublicUuid;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text_input' | 'numeric_input';
  points?: number;
  order?: number;
  answers?: Answer[];
  expected_answer?: string;
  image?: string | null;
  image_url?: string | null;
  image_path?: string | null;
  explanation?: string | null;
  subject?: string;
}

export interface ExamData {
  uuid?: PublicUuid;
  title: string;
  duration: number;
  total_questions: number;
}

export interface ExamAttemptSummary {
  uuid: PublicUuid;
  exam_uuid?: PublicUuid | null;
  status: string;
  started_at?: string;
  duration_minutes?: number;
  total_questions?: number;
}

export interface InProgressAttempt {
  uuid: PublicUuid;
  exam: {
    uuid: PublicUuid;
    title: string;
    type: string;
  };
  status: string;
}

export interface SubjectTest {
  uuid: PublicUuid;
  name: string;
}

export interface DepartmentSubject {
  uuid: PublicUuid;
  name: string;
  slug: string;
  description: string;
  questions_count: number;
  tests?: SubjectTest[];
}
