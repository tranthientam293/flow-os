import { useState } from "react";
import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { Alert, Button, Form, Input } from "antd";
import { EmptyState } from "@/components/molecules";
import { DISPLAY_NAME_MAX_LENGTH, ROUTES } from "@/constants";
import { signUpMutationOptions } from "@/apis";
import type { SignUpPayload } from "@/models";
import { getAuthErrorMessage } from "@/utils";
import {
  confirmPasswordRules,
  emailRules,
  newPasswordRules,
  PASSWORD_HINT,
} from "@/validations";

type SignUpValues = SignUpPayload & { confirmPassword: string };

export function SignUpForm() {
  const signUp = useMutation(signUpMutationOptions());
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(
    null,
  );

  const onFinish = ({ email, password, displayName }: SignUpValues) =>
    signUp.mutate(
      { email, password, displayName },
      {
        onSuccess: ({ needsEmailConfirmation }) =>
          needsEmailConfirmation && setConfirmationSentTo(email),
      },
    );

  if (confirmationSentTo) {
    return (
      <EmptyState
        icon={MailCheck}
        title='Check your inbox'
        description={
          <>
            We sent a confirmation link to{" "}
            <span className='text-foreground'>{confirmationSentTo}</span>. Open
            it to finish creating your workspace.
          </>
        }
        action={
          <Link
            to={ROUTES.SIGN_IN}
            className='text-sm text-foreground-light underline underline-offset-4 hover:text-foreground'
          >
            Back to sign in
          </Link>
        }
      />
    );
  }

  return (
    <div className='animate-fade-up'>
      <h1 className='text-2xl text-foreground'>Get started</h1>
      <p className='mt-1 text-sm text-muted-foreground'>
        Create your flowOS workspace
      </p>

      <Form
        className='mt-8'
        layout='vertical'
        validateTrigger='onBlur'
        onFinish={onFinish}
      >
        {signUp.isError && (
          <Alert
            type='error'
            showIcon
            title='Couldn’t create your account'
            description={getAuthErrorMessage(signUp.error)}
            className='mb-4'
          />
        )}

        <Form.Item name='displayName' label='Name'>
          <Input
            placeholder='Ada Lovelace'
            autoComplete='name'
            maxLength={DISPLAY_NAME_MAX_LENGTH}
          />
        </Form.Item>
        <Form.Item name='email' label='Email' rules={emailRules}>
          <Input placeholder='you@example.com' autoComplete='email' />
        </Form.Item>
        <Form.Item
          name='password'
          label='Password'
          extra={PASSWORD_HINT}
          rules={newPasswordRules}
        >
          <Input.Password placeholder='••••••••' autoComplete='new-password' />
        </Form.Item>
        <Form.Item
          name='confirmPassword'
          label='Confirm password'
          dependencies={["password"]}
          rules={confirmPasswordRules("password")}
        >
          <Input.Password placeholder='••••••••' autoComplete='new-password' />
        </Form.Item>

        <Form.Item className='mt-6 mb-0'>
          <Button
            type='primary'
            htmlType='submit'
            block
            loading={signUp.isPending}
          >
            Sign up
          </Button>
        </Form.Item>
      </Form>

      <p className='mt-8 text-center text-sm text-muted-foreground'>
        {"Have an account?"}{" "}
        <Link
          to={ROUTES.SIGN_IN}
          className='text-foreground underline underline-offset-4 hover:text-brand-strong'
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
