import { Link } from "react-router";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/molecules";
import { ROUTES } from "@/constants";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title='Page not found'
      description='The page or app you’re looking for doesn’t exist.'
      action={
        <Link
          to={ROUTES.HOME}
          className='text-sm text-foreground-light underline underline-offset-4 hover:text-foreground'
        >
          Go to Overview
        </Link>
      }
    />
  );
}
