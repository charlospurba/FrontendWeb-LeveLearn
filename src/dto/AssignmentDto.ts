export interface AssignmentDto {
  id: number;
  chapterId: number;
  instruction: string;
  fileUrl: string;
}

export interface AddAssignmentDto {
  chapterId: number;
  instruction: string;
  fileUrl: string;
}

export interface UpdateAssignmentDto {
  chapterId: number;
  instruction?: string;
  fileUrl?: string;
}
