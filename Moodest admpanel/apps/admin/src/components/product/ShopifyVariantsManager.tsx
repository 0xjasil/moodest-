"use client";

import React from "react";
import AbayaVariantsManager from "./AbayaVariantsManager";

interface ShopifyVariantsManagerProps {
  mode: "create" | "edit";
  backendSkuError?: string | null;
}

export default function ShopifyVariantsManager({
  mode,
  backendSkuError,
}: ShopifyVariantsManagerProps) {
  return <AbayaVariantsManager mode={mode} backendSkuError={backendSkuError} />;
}
