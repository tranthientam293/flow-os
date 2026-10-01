export const APP_NAME = "flowOS";

export const BACKEND_REGION_CODE = "ap-south-1";

export const APP_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

export const APP_CATEGORIES = [
  "Productivity",
  "Utilities",
  "Developer",
] as const;

export const PASSWORD_MIN_LENGTH = 6;
export const DISPLAY_NAME_MAX_LENGTH = 80;

export const QUERY_STALE_TIME_MS = 30_000;
