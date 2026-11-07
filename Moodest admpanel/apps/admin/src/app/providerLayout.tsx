"use client";
import React from "react";
import { ConfigurableProductProvider } from "@/context/ConfigurableProductContext";

export default function ProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigurableProductProvider>
      {children}
    </ConfigurableProductProvider>
  );
}
