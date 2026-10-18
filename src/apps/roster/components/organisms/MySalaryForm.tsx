import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Form, InputNumber, Spin } from "antd";
import {
  memberSessionTypesQueryOptions,
  sessionTypesQueryOptions,
} from "../../apis/session-types";
import {
  saveMyRatesMutationOptions,
  trainerRatesQueryOptions,
} from "../../apis/trainer-rates";
import type { Membership } from "../../models/roster";
import {
  formatRate,
  moneyInputProps,
  payBasisOf,
  rateSuffix,
} from "../../utils/money";
import { ownerRateFor, trainerOwnRateFor } from "../../utils/rates";

type Values = { rates: Record<string, number | null> };

interface MySalaryFormProps {
  membership: Membership;
}

export function MySalaryForm({ membership }: MySalaryFormProps) {
  const centerId = membership.center.id;
  const meId = membership.id;
  const types = useQuery(sessionTypesQueryOptions(centerId));
  const ownerRates = useQuery(memberSessionTypesQueryOptions(centerId));
  const myRates = useQuery(trainerRatesQueryOptions(centerId));
  const save = useMutation(saveMyRatesMutationOptions(centerId, meId));
  const [form] = Form.useForm<Values>();

  const rows = useMemo(() => {
    const all = types.data ?? [];
    const typeById = new Map(all.map((t) => [t.id, t]));
    const mine = (ownerRates.data ?? []).filter((r) => r.member_id === meId);
    const taught = mine.length
      ? all.filter((t) => mine.some((r) => r.session_type_id === t.id))
      : all;
    return taught.map((t) => ({
      type: t,
      ownerRate: ownerRateFor(ownerRates.data ?? [], typeById, meId, t.id),
      myRate: trainerOwnRateFor(myRates.data ?? [], meId, t.id),
    }));
  }, [types.data, ownerRates.data, myRates.data, meId]);

  if (types.isLoading || ownerRates.isLoading || myRates.isLoading)
    return <Spin size='small' />;
  if (!rows.length)
    return (
      <p className='text-sm text-muted-foreground'>
        This center has no session types yet.
      </p>
    );

  return (
    <Form<Values>
      // Remount when the saved rates change, so the fields show them.
      key={rows.map((r) => `${r.type.id}:${r.myRate}`).join(",")}
      form={form}
      layout='vertical'
      initialValues={{
        rates: Object.fromEntries(rows.map((r) => [r.type.id, r.myRate])),
      }}
      onFinish={(values) =>
        save.mutate(
          rows.map((r) => ({
            sessionTypeId: r.type.id,
            hourlyRate: values.rates?.[r.type.id] ?? null,
          })),
        )
      }
    >
      <div className='flex flex-col gap-3'>
        {rows.map((r) => (
          <Form.Item
            key={r.type.id}
            name={["rates", r.type.id]}
            label={r.type.name}
            extra={`Owner’s rate: ${formatRate(r.ownerRate, payBasisOf(r.type))}. Leave empty to use it.`}
            className='mb-0'
          >
            <InputNumber<number>
              {...moneyInputProps}
              suffix={rateSuffix(payBasisOf(r.type))}
              className='w-full sm:w-64'
              placeholder='Salary'
            />
          </Form.Item>
        ))}
      </div>
      <div className='mt-4 flex justify-end'>
        <Button type='primary' htmlType='submit' loading={save.isPending}>
          Save
        </Button>
      </div>
    </Form>
  );
}
