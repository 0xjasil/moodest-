import { AuthDemo } from "@/components/auth-demo/auth-demo";

export default function AuthForgotPasswordDemoPage() {
  return (
    <AuthDemo
      mode="forgot-password"
      variant="basic"
      altBasePath="/auth-cover"
    />
  );
}
