import { ErrorState } from "@/components/misc/error-state";

export const metadata = {
  title: "Error 404 - Commerce Admin",
  description: "The page you're looking for isn't found.",
};

export default function ErrorPage404() {
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
