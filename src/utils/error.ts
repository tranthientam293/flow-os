import i18next from "i18next";

export function getErrorMessage(
  error: unknown,
  fallback = i18next.t("common.somethingWentWrong"),
): string {
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  return fallback;
}
