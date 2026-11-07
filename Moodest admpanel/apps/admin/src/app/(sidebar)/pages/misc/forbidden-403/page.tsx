import { ErrorState } from "@/components/misc/error-state";

export const metadata = {
  title: "Forbidden 403 - Commerce Admin",
  description: "You do not have permission to view this page.",
};

export default function Forbidden403() {
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
