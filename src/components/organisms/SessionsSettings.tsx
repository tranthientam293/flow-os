import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EllipsisVertical, LogOut } from "lucide-react";
import { Button, Dropdown, Form, Grid, Input, Modal, Table } from "antd";
import { Badge, CenteredSpinner } from "@/components/atoms";
import { SettingsPanel } from "@/components/molecules";
import { DATE_FORMAT } from "@/constants";
import { useRequiredUser } from "@/context";
import { revokeSessionsMutationOptions, sessionsQueryOptions } from "@/apis";
import { dayjs } from "@/libs";
import type { AuthSession } from "@/models";
import { describeUserAgent } from "@/utils";

const DATE_TIME_FORMAT = `${DATE_FORMAT} HH:mm`;

const PASSWORD_ERRORS = {
  wrong_password: "That password isn’t right.",
  too_many_attempts:
    "Too many wrong passwords. Wait 15 minutes, then try again.",
};

// What the password dialog signs out: one session, or every other one.
type RevokeTarget = { session?: AuthSession };

export function SessionsSettings() {
  const user = useRequiredUser();
  const sessions = useQuery({
    ...sessionsQueryOptions(user.id),
    refetchOnWindowFocus: true,
  });
  const [target, setTarget] = useState<RevokeTarget | null>(null);
  const phone = Grid.useBreakpoint().sm === false;

  return (
    <SettingsPanel
      title='Sessions'
      description='Where your account is signed in. Sign out any session you don’t recognise.'
      flush
    >
      {sessions.isPending ? (
        <CenteredSpinner className='min-h-20' />
      ) : sessions.isError ? (
        <p className='px-4 py-5 text-sm text-muted-foreground sm:px-5'>
          Could not load your sessions.
        </p>
      ) : (
        <Table<AuthSession>
          rowKey='id'
          size='small'
          pagination={false}
          dataSource={sessions.data}
          tableLayout='fixed'
          rowClassName='group'
          className='w-full [&_.ant-table-cell]:whitespace-nowrap [&_.ant-table-cell:first-child]:ps-4 sm:[&_.ant-table-cell:first-child]:ps-5 [&_.ant-table-cell:last-child]:pe-4 sm:[&_.ant-table-cell:last-child]:pe-5 [&_.ant-table-thead_th]:before:hidden'
          columns={[
            {
              title: "Device",
              width: phone ? 128 : 200,
              render: (_, s) => <DeviceCell session={s} />,
            },
            {
              title: "IP",
              responsive: ["md"],
              className: "tabular-nums",
              render: (_, s) => s.ip ?? "—",
            },
            {
              title: "Created",
              responsive: ["sm"],
              className: "tabular-nums",
              render: (_, s) => dayjs(s.created_at).format(DATE_TIME_FORMAT),
            },
            {
              title: "Updated",
              className: "tabular-nums",
              render: (_, s) =>
                dayjs(s.last_active_at).format(DATE_TIME_FORMAT),
            },
            {
              key: "actions",
              width: 56,
              align: "right",
              render: (_, s) =>
                !s.is_current && (
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        {
                          key: "sign-out",
                          label: "Sign out",
                          icon: <LogOut />,
                          danger: true,
                          onClick: () => setTarget({ session: s }),
                        },
                      ],
                    }}
                  >
                    <Button
                      size='small'
                      type='text'
                      icon={<EllipsisVertical />}
                      aria-label='Session actions'
                      title='Session actions'
                      className='opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 [&.ant-dropdown-open]:opacity-100'
                    />
                  </Dropdown>
                ),
            },
          ]}
        />
      )}
      <div className='flex items-center justify-between gap-4 px-4 py-4 sm:px-5'>
        <div className='min-w-0'>
          <div className='text-sm text-foreground'>Sign out all devices</div>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Ends every session, this one included. You’ll need to sign in again.
          </p>
        </div>
        <Button
          size='small'
          danger
          className='shrink-0'
          onClick={() => setTarget({})}
        >
          Sign out
        </Button>
      </div>
      <ConfirmPasswordModal target={target} onClose={() => setTarget(null)} />
    </SettingsPanel>
  );
}

interface DeviceCellProps {
  session: AuthSession;
}

function DeviceCell({ session }: DeviceCellProps) {
  const label = describeUserAgent(session.user_agent);

  return (
    <div className='flex min-w-0 items-center gap-2 text-foreground'>
      <span className='truncate' title={label}>
        {label}
      </span>
      {session.is_current && (
        <Badge variant='brand' className='shrink-0'>
          Current
        </Badge>
      )}
    </div>
  );
}

interface ConfirmPasswordModalProps {
  target: RevokeTarget | null;
  onClose: () => void;
}

type PasswordValues = { password: string };

function ConfirmPasswordModal({ target, onClose }: ConfirmPasswordModalProps) {
  const user = useRequiredUser();
  const revoke = useMutation(revokeSessionsMutationOptions(user.id));
  const [form] = Form.useForm<PasswordValues>();
  const session = target?.session;

  const onFinish = async ({ password }: PasswordValues) => {
    const status = await revoke.mutateAsync({
      password,
      sessionId: session?.id,
    });
    if (status === "ok") return onClose();
    form.setFields([{ name: "password", errors: [PASSWORD_ERRORS[status]] }]);
  };

  return (
    <Modal
      open={!!target}
      title={
        session
          ? `Sign out ${describeUserAgent(session.user_agent)}?`
          : "Sign out all devices?"
      }
      okText='Sign out'
      okButtonProps={{
        danger: true,
        htmlType: "submit",
        form: "revoke-sessions",
      }}
      confirmLoading={revoke.isPending}
      onCancel={onClose}
      width={400}
      destroyOnHidden
    >
      <p className='text-sm text-foreground-light'>
        {session
          ? "That session will be signed out within the hour."
          : "Every device will be signed out, this one included. You’ll need to sign in again."}{" "}
        Enter your password to confirm.
      </p>
      <Form
        id='revoke-sessions'
        form={form}
        layout='vertical'
        className='mt-4'
        onFinish={(values) => void onFinish(values).catch(() => {})}
      >
        <Form.Item
          name='password'
          label='Password'
          rules={[{ required: true, message: "Enter your password." }]}
          className='mb-0'
        >
          <Input.Password autoComplete='current-password' />
        </Form.Item>
      </Form>
    </Modal>
  );
}
