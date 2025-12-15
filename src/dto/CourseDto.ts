export interface CourseDto {
  id: number;
  code: string;
  name: string;
  description: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddCourseDto {
  name: string;
  code: string;
  description: string;
  image: string;
}

export interface UpdateCourseDto {
  name?: string;
  code?: string;
  description?: string;
  image?: string;
}
