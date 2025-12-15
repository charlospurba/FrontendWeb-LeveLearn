export interface MaterialDto {
  id: number;
  chapterId: number;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddMaterialDto {
  chapterId: number;
  name: string;
  content: string;
}