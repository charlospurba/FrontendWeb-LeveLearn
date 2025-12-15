export interface Question {
  question: string;
  options?: string[];
  answer: string;
  type: 'MC' | 'EY';
}

export interface AssessmentDto {
  id: number;
  chapterId: number;
  instruction: string;
  questions?: string | null;
  answers?: any | null;
  createdAt: string;
  updatedAt: string;
}