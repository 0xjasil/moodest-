// Subcategory type — NestJS backend uses the categories table with parentId
// No separate SubCategory model; this type represents the UI shape.

export interface SubCategoryWithCategory {
  id: string;
  name: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
