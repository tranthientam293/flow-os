export const ROUTES = {
  HOME: "/",
  STORE: "/store",
  SETTINGS: "/settings",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  APP_PATTERN: "/apps/:appId/*",
} as const;

export const appPath = (appId: string) => `/apps/${appId}`;
