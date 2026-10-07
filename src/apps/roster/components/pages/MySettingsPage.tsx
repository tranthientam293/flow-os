import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button, Form, Input, Popconfirm, Segmented, Select, Spin } from "antd";
import { Badge } from "@/components/atoms";
import { SettingsPanel } from "@/components/molecules";
import { useAppStorage } from "@/hooks";
import { leaveCenterMutationOptions } from "../../apis/centers";
import {
  memberQueryOptions,
  updateMyProfileMutationOptions,
  type MyProfile,
} from "../../apis/members";
import { STORAGE_KEYS } from "../../constants/keys";
import { useLogOut } from "../../hooks/useLogOut";
import type { Membership } from "../../models/roster";

export function MySettingsPage({ memberships }: { memberships: Membership[] }) {
  const [centerId, setCenterId] = useState(memberships[0]?.center.id);
  const membership =
    memberships.find((m) => m.center.id === centerId) ?? memberships[0];
  const { logOut, holder } = useLogOut();

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6'>
      {holder}
      <div>
        <h2 className='text-base font-medium text-foreground'>My settings</h2>
        <p className='text-sm text-muted-foreground'>
          Your profile, preferences and centers in Roster.
        </p>
      </div>

      {membership && (
        <SettingsPanel
          title='My profile'
          description='How you appear on the schedule. Each center keeps its own profile.'
        >
          {memberships.length > 1 && (
            <Select
              className='mb-4 w-full sm:w-64'
              aria-label='Center'
              value={membership.center.id}
              onChange={setCenterId}
              options={memberships.map((m) => ({
                value: m.center.id,
                label: m.center.name,
              }))}
            />
          )}
          <ProfileForm key={membership.id} membership={membership} />
        </SettingsPanel>
      )}

      <SettingsPanel
        title='Preferences'
        description='Saved for your account on every device.'
      >
        <Preferences />
      </SettingsPanel>

      <SettingsPanel
        title='My centers'
        description='Centers you own or train at.'
      >
        <MyCenters memberships={memberships} />
      </SettingsPanel>

      <SettingsPanel
        title='Log out'
        description='Leave Roster and go back to the flowOS home screen.'
      >
        <Button icon={<LogOut />} onClick={logOut}>
          Log out
        </Button>
      </SettingsPanel>
    </div>
  );
}

function ProfileForm({ membership }: { membership: Membership }) {
  const centerId = membership.center.id;
  const me = useQuery(memberQueryOptions(centerId, membership.id));
  const save = useMutation(updateMyProfileMutationOptions(centerId));
  const [form] = Form.useForm<MyProfile>();

  if (!me.data) return <Spin size='small' />;

  return (
    <Form<MyProfile>
      form={form}
      layout='vertical'
      initialValues={{
        display_name: me.data.display_name,
        phone: me.data.phone,
      }}
      onFinish={(values) =>
        save.mutate({
          display_name: values.display_name.trim(),
          phone: values.phone?.trim() || null,
          color: me.data.color,
        })
      }
    >
      <Form.Item
        name='display_name'
        label='Name'
        rules={[{ required: true, whitespace: true }, { max: 80 }]}
      >
        <Input maxLength={80} />
      </Form.Item>
      <Form.Item label='Email' extra='Your flowOS sign-in email.'>
        <Input value={me.data.email} disabled />
      </Form.Item>
      <Form.Item name='phone' label='Phone' rules={[{ max: 40 }]}>
        <Input maxLength={40} />
      </Form.Item>
      <div className='flex justify-end'>
        <Button type='primary' htmlType='submit' loading={save.isPending}>
          Save profile
        </Button>
      </div>
    </Form>
  );
}

function Preferences() {
  const [view, setView] = useAppStorage<"week" | "day">(
    STORAGE_KEYS.scheduleView,
    "week",
  );
  return (
    <div className='flex items-center justify-between gap-3 text-sm'>
      <span className='text-foreground-light'>Center calendars open in</span>
      <Segmented<"week" | "day">
        size='small'
        value={view}
        onChange={setView}
        options={[
          { value: "week", label: "Week" },
          { value: "day", label: "Day" },
        ]}
      />
    </div>
  );
}

function MyCenters({ memberships }: { memberships: Membership[] }) {
  const leave = useMutation(leaveCenterMutationOptions());

  if (!memberships.length)
    return (
      <p className='text-sm text-muted-foreground'>
        You haven’t created or joined a center yet.
      </p>
    );

  return (
    <ul className='divide-y rounded-md border'>
      {memberships.map((m) => (
        <li key={m.id} className='flex items-center gap-3 px-3 py-2 text-sm'>
          <span className='min-w-0 flex-1 truncate text-foreground'>
            {m.center.name}
          </span>
          <Badge variant={m.role === "owner" ? "brand" : "status"}>
            {m.role === "owner"
              ? m.also_trainer
                ? "Owner · Trainer"
                : "Owner"
              : "Trainer"}
          </Badge>
          {m.role === "trainer" && (
            <Popconfirm
              title={`Leave ${m.center.name}?`}
              description='You lose access to its schedule. Your past sessions stay.'
              okText='Leave'
              okButtonProps={{ danger: true }}
              onConfirm={() => leave.mutate(m.center.id)}
            >
              <Button
                size='small'
                type='text'
                danger
                loading={leave.isPending && leave.variables === m.center.id}
              >
                Leave
              </Button>
            </Popconfirm>
          )}
        </li>
      ))}
    </ul>
  );
}
