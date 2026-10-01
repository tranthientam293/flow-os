export type SignInPayload = { email: string; password: string };

export type SignUpPayload = SignInPayload & { displayName?: string };

export type SignUpResult = {
  needsEmailConfirmation: boolean;
};
