import { ErrorState } from "@/components/misc/error-state";

export const metadata = {
  title: "401 Unauthorized - Commerce Admin",
  description: "Your session has expired.",
};

export default function UnauthorizedPage() {
  return (
    <ErrorState
      headline="Unauthorized"
      code="401"
      title="Access Restricted"
      description="Your session has expired or you need to log in to access this page."
      buttonText="Back to home page"
      buttonHref="/"
    />
  );
}
