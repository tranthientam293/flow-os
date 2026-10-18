import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Form, Spin } from "antd";
import { SettingsPanel } from "@/components/molecules";
import { useFlowApp } from "@/context";
import {
  saveMonthlyLimitMutationOptions,
  settingsQueryOptions,
} from "../../apis/settings";
import { AmountInput } from "../molecules";

type LimitValues = { monthlyLimit?: number };

export function MonthlyLimitSettings() {
  const { user } = useFlowApp();
  const settings = useQuery(settingsQueryOptions(user.id));
  // Bumped by Cancel: AmountInput keeps its own text, so the form remounts.
  const [resets, setResets] = useState(0);

  if (settings.isLoading)
    return (
      <div className='flex justify-center py-6'>
        <Spin />
      </div>
    );
  const saved = settings.data?.monthly_limit ?? undefined;
  return (
    <LimitForm
      key={`${saved}-${resets}`}
      saved={saved}
      onCancel={() => setResets((n) => n + 1)}
    />
  );
}

interface LimitFormProps {
  saved?: number;
  onCancel: () => void;
}

function LimitForm({ saved, onCancel }: LimitFormProps) {
  const { app, user } = useFlowApp();
  const save = useMutation(saveMonthlyLimitMutationOptions(user.id));
  const [form] = Form.useForm<LimitValues>();
  const limit = Form.useWatch("monthlyLimit", form);
  const dirty = limit !== saved;

  return (
    <Form<LimitValues>
      form={form}
      layout='vertical'
      requiredMark={false}
      initialValues={{ monthlyLimit: saved }}
      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
      onFinish={({ monthlyLimit }) => save.mutate(monthlyLimit ?? null)}
    >
      <SettingsPanel
        title='Monthly limit'
        description={`How much you plan to spend each month. ${app.name}'s Dashboard shows how much of it is left.`}
        footer={
          <>
            {saved !== undefined && (
              <Button
                size='small'
                danger
                className='me-auto'
                disabled={save.isPending}
                onClick={() => save.mutate(null)}
              >
                Remove limit
              </Button>
            )}
            <Button
              size='small'
              disabled={!dirty || save.isPending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type='primary'
              htmlType='submit'
              size='small'
              disabled={!dirty}
              loading={save.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <Form.Item
          name='monthlyLimit'
          label='Limit per month'
          extra='Leave it empty for no limit.'
          className='mb-0'
          rules={[
            {
              type: "number",
              min: 1,
              message: "The limit must be more than 0",
            },
          ]}
        >
          <AmountInput operators={false} />
        </Form.Item>
      </SettingsPanel>
    </Form>
  );
}
