import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { Button, Input } from "antd";
import { Trans, useTranslation } from "react-i18next";
import { EmptyState, FormField } from "@/components/molecules";
import { PASSWORD_MIN_LENGTH, ROUTES } from "@/constants";
import { signInMutationOptions, signUpMutationOptions } from "@/apis";
import { getErrorMessage } from "@/utils";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(
    null,
  );
  const isSignUp = mode === "sign-up";
  const copy = isSignUp ? "auth.signUp" : "auth.signIn";
  const switchTo = isSignUp ? ROUTES.SIGN_IN : ROUTES.SIGN_UP;

  const signIn = useMutation(signInMutationOptions());
  const signUp = useMutation(signUpMutationOptions());
  const mutation = isSignUp ? signUp : signIn;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isSignUp) return signIn.mutate({ email, password });
    signUp.mutate(
      { email, password, displayName },
      {
        onSuccess: ({ needsEmailConfirmation }) =>
          needsEmailConfirmation && setConfirmationSentTo(email),
      },
    );
  };

  if (confirmationSentTo) {
    return (
      <EmptyState
        icon={MailCheck}
        title={t("auth.checkInbox")}
        description={
          <Trans
            i18nKey='auth.checkInboxDescription'
            values={{ email: confirmationSentTo }}
            components={{ email: <span className='text-foreground' /> }}
          />
        }
        action={
          <Link
            to={ROUTES.SIGN_IN}
            className='text-sm text-foreground-light underline underline-offset-4 hover:text-foreground'
          >
            {t("auth.backToSignIn")}
          </Link>
        }
      />
    );
  }

  return (
    <div className='animate-fade-up'>
      <h1 className='text-2xl text-foreground'>{t(`${copy}.title`)}</h1>
      <p className='mt-1 text-sm text-muted-foreground'>
        {t(`${copy}.subtitle`)}
      </p>

      <form onSubmit={onSubmit} className='mt-8 flex flex-col gap-4'>
        {isSignUp && (
          <FormField label={t("auth.name")}>
            {(id) => (
              <Input
                id={id}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("auth.namePlaceholder")}
                autoComplete='name'
              />
            )}
          </FormField>
        )}
        <FormField label={t("auth.email")}>
          {(id) => (
            <Input
              id={id}
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              autoComplete='email'
            />
          )}
        </FormField>
        <FormField
          label={t("auth.password")}
          hint={
            isSignUp
              ? t("auth.passwordHint", { count: PASSWORD_MIN_LENGTH })
              : undefined
          }
        >
          {(id) => (
            <Input
              id={id}
              type='password'
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          )}
        </FormField>

        {mutation.isError && (
          <p
            role='alert'
            className='rounded-md border border-destructive-border bg-destructive-soft px-3 py-2 text-sm text-destructive'
          >
            {getErrorMessage(mutation.error)}
          </p>
        )}

        <Button
          type='primary'
          htmlType='submit'
          block
          className='mt-2'
          loading={mutation.isPending}
        >
          {t(`${copy}.submit`)}
        </Button>
      </form>

      <p className='mt-8 text-center text-sm text-muted-foreground'>
        {t(`${copy}.switchText`)}{" "}
        <Link
          to={switchTo}
          className='text-foreground underline underline-offset-4 hover:text-brand-strong'
        >
          {t(`${copy}.switchLabel`)}
        </Link>
      </p>
    </div>
  );
}
