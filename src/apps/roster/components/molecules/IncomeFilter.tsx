import { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import { ListFilter } from "lucide-react";
import { Badge, Button, DatePicker, Form, Grid, Modal, Select } from "antd";
import { MONTH_FORMAT } from "@/constants";
import { dayjs } from "@/libs";
import type { Membership } from "../../models/roster";

export const ALL_CENTERS = "all";

export interface IncomeFilters {
  /** First day of the month, `YYYY-MM-DD`. */
  month: string;
  /** A center id, or `ALL_CENTERS`. */
  centerId: string;
}

interface IncomeFilterFormValues {
  month: Dayjs;
  centerId: string;
}

const toFormValues = (filters: IncomeFilters): IncomeFilterFormValues => ({
  month: dayjs(filters.month),
  centerId: filters.centerId,
});

interface IncomeFilterProps {
  value: IncomeFilters;
  memberships: Membership[];
  /** First day of the current month; later months can't be picked. */
  thisMonth: string;
  onApply: (filters: IncomeFilters) => void;
}

export function IncomeFilter({
  value,
  memberships,
  thisMonth,
  onApply,
}: IncomeFilterProps) {
  const [form] = Form.useForm<IncomeFilterFormValues>();
  const phone = Grid.useBreakpoint().md === false;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeCount = [
    value.month !== thisMonth,
    value.centerId !== ALL_CENTERS,
  ].filter(Boolean).length;

  useEffect(() => {
    form.setFieldsValue(toFormValues(value));
  }, [form, value]);

  const apply = (values: IncomeFilterFormValues) => {
    onApply({
      month: values.month.startOf("month").format("YYYY-MM-DD"),
      centerId: values.centerId,
    });
    setIsSheetOpen(false);
  };

  const clearButton = (
    <Button
      onClick={() =>
        form.setFieldsValue(
          toFormValues({ month: thisMonth, centerId: ALL_CENTERS }),
        )
      }
    >
      Clear all
    </Button>
  );
  const applyButton = (
    <Button type='primary' onClick={() => form.submit()}>
      Apply
    </Button>
  );

  const fields = (
    <Form<IncomeFilterFormValues>
      form={form}
      layout={phone ? "vertical" : "inline"}
      onFinish={apply}
      className={phone ? "py-2" : "flex-wrap gap-y-2"}
    >
      <Form.Item name='month' label={phone ? "Month" : undefined}>
        <DatePicker
          picker='month'
          aria-label='Month'
          format={MONTH_FORMAT}
          allowClear={false}
          className={phone ? "w-full" : undefined}
          disabledDate={(d) =>
            d.startOf("month").format("YYYY-MM-DD") > thisMonth
          }
        />
      </Form.Item>
      <Form.Item name='centerId' label={phone ? "Center" : undefined}>
        <Select
          aria-label='Center'
          popupMatchSelectWidth={false}
          className={phone ? undefined : "min-w-48"}
          options={[
            { value: ALL_CENTERS, label: "All centers" },
            ...memberships.map((m) => ({
              value: m.center.id,
              label: m.center.name,
            })),
          ]}
        />
      </Form.Item>
      {!phone && (
        <Form.Item>
          <div className='flex items-center gap-2'>
            {clearButton}
            {applyButton}
          </div>
        </Form.Item>
      )}
    </Form>
  );

  if (!phone) return fields;

  return (
    <>
      <Badge
        count={activeCount}
        size='small'
        color='var(--primary)'
        className='flex'
      >
        <Button
          icon={<ListFilter />}
          aria-label={
            activeCount ? `Filters (${activeCount} active)` : "Filters"
          }
          onClick={() => {
            form.setFieldsValue(toFormValues(value));
            setIsSheetOpen(true);
          }}
        >
          Filter
        </Button>
      </Badge>
      <Modal
        open={isSheetOpen}
        title='Filters'
        onCancel={() => setIsSheetOpen(false)}
        width={420}
        forceRender
        footer={
          <div className='flex items-center justify-between gap-2'>
            {clearButton}
            {applyButton}
          </div>
        }
      >
        {fields}
      </Modal>
    </>
  );
}
