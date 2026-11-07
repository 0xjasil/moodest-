import { ErrorState } from "@/components/misc/error-state";

export const metadata = {
  title: "404 Not Found - Commerce Admin",
  description: "The page you're looking for isn't found.",
};

export default function NotFoundPage() {
  return (
    <ErrorState
      headline="Whoops!"
      code="404"
      title="Something went wrong"
      description="The page you're looking for isn't found, we suggest you back to home."
      buttonText="Back to home page"
      buttonHref="/"
    />
  );
}
