import { AdminLoginForm } from "@/components/auth/admin-login-form";
import React, { Suspense } from "react";

function AdminLoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}

export default AdminLoginPage;
