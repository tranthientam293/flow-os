import type { FormRule } from "antd";
import { PASSWORD_PATTERN } from "@/constants";

export const PASSWORD_HINT =
  "At least 8 characters, with uppercase and lowercase letters, a number and a symbol.";

export const emailRules: FormRule[] = [
  { required: true, message: "Enter your email." },
  { type: "email", message: "Enter a valid email address." },
];

export const passwordRules: FormRule[] = [
  { required: true, message: "Enter your password." },
];

export const newPasswordRules: FormRule[] = [
  ...passwordRules,
  {
    pattern: PASSWORD_PATTERN,
    message: "Password doesn’t meet the requirements.",
  },
];

export const confirmPasswordRules = (field = "password"): FormRule[] => [
  { required: true, message: "Confirm your password." },
  ({ getFieldValue }) => ({
    validator: (_, value?: string) =>
      !value || value === getFieldValue(field)
        ? Promise.resolve()
        : Promise.reject(new Error("Passwords don’t match.")),
  }),
];
