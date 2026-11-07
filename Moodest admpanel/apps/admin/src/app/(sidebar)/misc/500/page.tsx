import { ErrorState } from "@/components/misc/error-state";

export const metadata = {
  title: "500 Server Error - Commerce Admin",
  description: "Internal server error.",
};

export default function ServerErrorPage() {
  return (
    <ErrorState
      headline="500 Internal Error"
      code="500"
      title="Something went wrong"
      description="Something went wrong on our end. Please try again in a few moments."
      buttonText="Back to home page"
      buttonHref="/"
    />
  );
}
