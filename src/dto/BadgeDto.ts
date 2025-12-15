export interface BadgeDto {
  id: number;
  name: string;
  image: string;
  type: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCE';
  courseId: number;
  chapterId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddBadgeDto {
  name: string;
  image: string;
  type: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCE';
  courseId: number;
  chapterId: number;
}

export interface UpdateBadgeDto {
  name?: string;
  image?: string;
  type?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCE';
  courseId?: number;
  chapterId?: number;
}
