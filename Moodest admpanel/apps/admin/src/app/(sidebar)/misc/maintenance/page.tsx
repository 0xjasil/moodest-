import { ErrorState } from "@/components/misc/error-state";

export const metadata = {
  title: "Under Maintenance - Commerce Admin",
  description: "We are temporarily down for scheduled maintenance.",
};

export default function MaintenancePage() {
  return (
    <ErrorState
      headline="Maintenance"
      code="503"
      title="Under Maintenance"
      description="We're temporarily down for maintenance. We'll be back online shortly."
      buttonText="Back to home page"
      buttonHref="/"
    />
  );
}
