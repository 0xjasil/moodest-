"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const ProductDialogForm = () => {
  const router = useRouter();

  return (
    <Button onClick={() => router.push("/products/add-product")}>
      Add Product
    </Button>
  );
};
