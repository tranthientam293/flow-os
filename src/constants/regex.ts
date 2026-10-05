export const APP_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

// Mirrors the Supabase Auth password policy (Authentication → Policies):
// 8+ characters with a lowercase letter, an uppercase letter, a digit and one
// of Supabase's symbols. `s` lets `.` match any character.
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+=[\]{};'\\:"|<>?,./`~-]).{8,}$/s;
