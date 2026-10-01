function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value)
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  return value;
}

export const ENV = {
  SUPABASE_URL: required("VITE_SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: required("VITE_SUPABASE_PUBLISHABLE_KEY"),
  IS_DEV: import.meta.env.DEV,
} as const;
