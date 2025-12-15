export interface AssessResponseDto {
  id: number;
  userId: number;
  chapterId: number;
  isStarted: boolean;
  isCompleted: boolean;
  materialDone: boolean;
  assessmentDone: boolean;
  assignmentDone: boolean;
  assessmentAnswer: string;
  assessmentGrade: number;
  submission: string;
  timeStarted: string;
  timeFinished: string;
  assignmentScore: number;
  assignmentFeedback: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string; studentId: number };
}
