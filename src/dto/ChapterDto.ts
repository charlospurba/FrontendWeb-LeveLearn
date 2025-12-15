export interface ChapterDto {
  id: number,
  name: string,
  description: string,
  level: number,
  courseId: number,
  isCheckpoint: number,
  createdAt: string,
  updatedAt: string,
}

export interface AddChapterDto {
  name: string,
  description: string,
  courseId: number,
}

export interface UpdateChapterDto {
  name?: string,
  description?: string,
  isCheckpoint?: number,
}