import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Form, Input } from "antd";
import { SettingsPanel } from "@/components/molecules";
import { DISPLAY_NAME_MAX_LENGTH } from "@/constants";
import { useRequiredUser } from "@/context";
import { profileQueryOptions, updateProfileMutationOptions } from "@/apis";
import { formatDate } from "@/libs";

type ProfileValues = { displayName: string };

export function ProfileSettings() {
  const user = useRequiredUser();
  const { data: profile } = useQuery(profileQueryOptions(user.id));
  const saved = profile?.display_name ?? "";
  return <ProfileForm key={saved} saved={saved} />;
}

function ProfileForm({ saved }: { saved: string }) {
  const user = useRequiredUser();
  const update = useMutation(updateProfileMutationOptions(user.id));
  const [form] = Form.useForm<ProfileValues>();
  const name = Form.useWatch("displayName", form) ?? saved;
  const dirty = name !== saved;

  const onFinish = ({ displayName }: ProfileValues) =>
    update.mutate({ display_name: displayName.trim() || null });

  return (
    <Form
      form={form}
      layout='vertical'
      initialValues={{ displayName: saved }}
      onFinish={onFinish}
    >
      <SettingsPanel
        title='Profile'
        description={`How you appear across your workspace. Member since ${formatDate(user.created_at)}.`}
        footer={
          <>
            <Button
              size='small'
              disabled={!dirty || update.isPending}
              onClick={() => form.resetFields()}
            >
              Cancel
            </Button>
            <Button
              type='primary'
              htmlType='submit'
              size='small'
              disabled={!dirty}
              loading={update.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <Form.Item name='displayName' label='Display name' className='mb-0'>
            <Input maxLength={DISPLAY_NAME_MAX_LENGTH} />
          </Form.Item>
          <Form.Item
            label='Email'
            extra='Email changes are not supported yet.'
            className='mb-0'
          >
            <Input value={user.email ?? ""} disabled readOnly />
          </Form.Item>
        </div>
      </SettingsPanel>
    </Form>
  );
}
