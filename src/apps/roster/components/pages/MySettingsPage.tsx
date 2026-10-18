import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { House } from "lucide-react";
import { Button, Form, Input, Popconfirm, Segmented, Spin } from "antd";
import { Badge } from "@/components/atoms";
import { SettingsPanel } from "@/components/molecules";
import { APP_NAME } from "@/constants";
import { useAppStorage, useBackToPlatform } from "@/hooks";
import { cn } from "@/utils";
import { leaveCenterMutationOptions } from "../../apis/centers";
import {
  memberQueryOptions,
  updateMyProfileMutationOptions,
  type MyProfile,
} from "../../apis/members";
import { STORAGE_KEYS } from "../../constants/keys";
import { ROSTER_LEAVE_NOTE } from "../../constants/options";
import { MySalaryForm } from "../organisms";
import type { Membership } from "../../models/roster";

interface MySettingsPageProps {
  memberships: Membership[];
}

export function MySettingsPage({ memberships }: MySettingsPageProps) {
  const [centerId, setCenterId] = useState(memberships[0]?.center.id);
  const membership =
    memberships.find((m) => m.center.id === centerId) ?? memberships[0];
  const { backToPlatform, holder } = useBackToPlatform(ROSTER_LEAVE_NOTE);
  const trainsAnywhere = memberships.some((m) => m.role !== "owner");
  const centerTabs = membership && memberships.length > 1 && (
    <CenterTabs
      memberships={memberships}
      activeCenterId={membership.center.id}
      onChange={setCenterId}
    />
  );

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
          {centerTabs}
          <ProfileForm key={membership.id} membership={membership} />
        </SettingsPanel>
      )}

      {membership && trainsAnywhere && (
        <SettingsPanel
          title='My salary'
          description='Your salary for each session type you teach, per shift, per hour or per trainee as the type pays. It fills in your salary when you complete a session; the owner’s rate is shown as a reference.'
        >
          {centerTabs}
          {membership.role === "owner" ? (
            <p className='text-sm text-muted-foreground'>
              You own {membership.center.name}, so you aren’t paid a salary
              there.
            </p>
          ) : (
            <MySalaryForm key={membership.id} membership={membership} />
          )}
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
        title={`Back to ${APP_NAME}`}
        description={`Leave Roster and go back to the ${APP_NAME} home screen. You stay signed in.`}
      >
        <Button icon={<House />} onClick={backToPlatform}>
          Back to {APP_NAME}
        </Button>
      </SettingsPanel>
    </div>
  );
}

interface CenterTabsProps {
  memberships: Membership[];
  activeCenterId: string;
  onChange: (centerId: string) => void;
}

function CenterTabs({
  memberships,
  activeCenterId,
  onChange,
}: CenterTabsProps) {
  return (
    <div
      role='tablist'
      aria-label='Center'
      className='mb-4 flex h-10 scrollbar-none items-stretch gap-1 overflow-x-auto overflow-y-hidden border-b [&::-webkit-scrollbar]:hidden'
    >
      {memberships.map((m) => {
        const isActive = m.center.id === activeCenterId;
        return (
          <button
            key={m.id}
            type='button'
            role='tab'
            aria-selected={isActive}
            onClick={() => onChange(m.center.id)}
            className={cn(
              "flex shrink-0 items-center px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
              isActive &&
                "text-foreground shadow-[inset_0_-2px_0_var(--foreground)]",
            )}
          >
            {m.center.name}
          </button>
        );
      })}
    </div>
  );
}

interface ProfileFormProps {
  membership: Membership;
}

function ProfileForm({ membership }: ProfileFormProps) {
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
  const [view, setView] = useAppStorage<"day" | "week">(
    STORAGE_KEYS.scheduleView,
    "week",
  );
  return (
    <div className='flex items-center justify-between gap-3 text-sm'>
      <span className='text-foreground-light'>Center calendars open in</span>
      <Segmented<"day" | "week">
        size='small'
        value={view}
        onChange={setView}
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week" },
        ]}
      />
    </div>
  );
}

interface MyCentersProps {
  memberships: Membership[];
}

function MyCenters({ memberships }: MyCentersProps) {
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
