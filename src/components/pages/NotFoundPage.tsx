import { Link } from "react-router";
import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/molecules";
import { ROUTES } from "@/constants";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={Compass}
      title={t("notFound.title")}
      description={t("notFound.description")}
      action={
        <Link
          to={ROUTES.HOME}
          className='text-sm text-foreground-light underline underline-offset-4 hover:text-foreground'
        >
          {t("notFound.back")}
        </Link>
      }
    />
  );
}
