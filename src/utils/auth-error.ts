import { isAuthError } from "@supabase/supabase-js";
import { getErrorMessage } from "./error";

// Friendlier text for Supabase Auth errors users commonly hit.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Confirm your email address before signing in.",
  user_already_exists: "An account with this email already exists.",
  email_exists: "An account with this email already exists.",
  email_address_invalid: "Enter a valid email address.",
  weak_password: "Password doesn’t meet the requirements.",
};

export function getAuthErrorMessage(error: unknown) {
  if (isAuthError(error) && error.code && AUTH_ERROR_MESSAGES[error.code])
    return AUTH_ERROR_MESSAGES[error.code];
  return getErrorMessage(error);
}
