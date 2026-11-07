import { ErrorState } from "@/components/misc/error-state";

export const metadata = {
  title: "403 Forbidden - Commerce Admin",
  description: "You do not have permission to view this page.",
};

export default function ForbiddenPage() {
  return (
    <ErrorState
      headline="Restricted Area"
      code="403"
      title="Access Denied"
      description="You do not have permission to view this page. Please contact your administrator if you believe this is an error."
      buttonText="Back to home page"
      buttonHref="/"
    />
  );
}
