"use client";

import { Loader2 } from "lucide-react";

export default function AdminLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center w-full h-40 text-muted-foreground">
      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}


