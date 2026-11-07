import { AuthDemo } from "@/components/auth-demo/auth-demo";

export default function AuthVerifyEmailDemoPage() {
  return (
    <AuthDemo mode="verify-email" variant="basic" altBasePath="/auth-cover" />
  );
}
