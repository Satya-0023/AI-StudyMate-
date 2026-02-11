export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export interface Topic {
  id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  explanation: string;
  quiz: QuizQuestion[];
  score: number | null;
  created_at: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
}
