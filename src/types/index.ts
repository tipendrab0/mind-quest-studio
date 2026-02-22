import { Tables } from "@/integrations/supabase/types";

export type Chapter = Tables<"chapters">;
export type ChapterFile = Tables<"chapter_files">;
export type QuizSession = Tables<"quiz_sessions">;
export type Question = Tables<"questions">;
export type Answer = Tables<"answers">;

export type QuestionType = "mcq" | "numerical" | "theoretical" | "mixed";
export type Difficulty = "easy" | "medium" | "hard" | "olympiad";

export interface GeneratedQuestion {
  question_text: string;
  question_type: string;
  options: string[] | null;
  marks: number;
  ideal_answer: string;
}

export interface GradeResult {
  score: number;
  max_score: number;
  is_correct: boolean;
  feedback: string;
  improvements: string[];
  correct_answer?: string;
  step_analysis?: string;
}
