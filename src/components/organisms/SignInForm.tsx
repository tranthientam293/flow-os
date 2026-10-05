import { Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Form, Input } from "antd";
import { ROUTES } from "@/constants";
import { signInMutationOptions } from "@/apis";
import type { SignInPayload } from "@/models";
import { getAuthErrorMessage } from "@/utils";
import { emailRules, passwordRules } from "@/validations";

export function SignInForm() {
  const signIn = useMutation(signInMutationOptions());

  const onFinish = (values: SignInPayload) => signIn.mutate(values);

  return (
    <div className='animate-fade-up'>
      <h1 className='text-2xl text-foreground'>Welcome back</h1>
      <p className='mt-1 text-sm text-muted-foreground'>
        Sign in to your workspace
      </p>

      <Form
        className='mt-8'
        layout='vertical'
        validateTrigger='onBlur'
        onFinish={onFinish}
      >
        {signIn.isError && (
          <Alert
            type='error'
            showIcon
            title='Couldn’t sign in'
            description={getAuthErrorMessage(signIn.error)}
            className='mb-4'
          />
        )}

        <Form.Item name='email' label='Email' rules={emailRules}>
          <Input placeholder='you@example.com' autoComplete='email' />
        </Form.Item>
        <Form.Item name='password' label='Password' rules={passwordRules}>
          <Input.Password
            placeholder='••••••••'
            autoComplete='current-password'
          />
        </Form.Item>

        <Form.Item className='mt-6 mb-0'>
          <Button
            type='primary'
            htmlType='submit'
            block
            loading={signIn.isPending}
          >
            Sign in
          </Button>
        </Form.Item>
      </Form>

      <p className='mt-8 text-center text-sm text-muted-foreground'>
        {"Don’t have an account?"}{" "}
        <Link
          to={ROUTES.SIGN_UP}
          className='text-foreground underline underline-offset-4 hover:text-brand-strong'
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
