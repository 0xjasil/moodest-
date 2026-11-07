export interface Page {
  id: string | number;
  title: string;
  slug: string;
  content?: string | null;
  status?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
