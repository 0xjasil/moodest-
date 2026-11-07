import { CommerceoCategoryList } from "@/components/category/CommerceoCategoryList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Category List - Commerce Admin",
  description: "Manage product categories, earnings, and inventory catalog",
};

export default function CategoriesListPage() {
  return <CommerceoCategoryList />;
}

