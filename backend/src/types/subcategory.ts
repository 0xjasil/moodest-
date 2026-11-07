// types/subcategory.ts (create this file)
import { SubCategory } from "@prisma/client";

export type SubCategoryWithCategory = SubCategory & {
  category: {
    id: string;
    name: string;
  };
};