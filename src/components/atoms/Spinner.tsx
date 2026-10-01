import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";

function Spinner({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Loader2
      aria-label={t("common.loading")}
      className={cn(
        "size-[18px] animate-spin text-muted-foreground",
        className,
      )}
    />
  );
}

function CenteredSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-40 items-center justify-center",
        className,
      )}
    >
      <Spinner />
    </div>
  );
}

export { Spinner, CenteredSpinner };
