import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarOff, Lock } from "lucide-react";
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Grid,
  Input,
  Select,
  Switch,
  TimePicker,
} from "antd";
import { EmptyState } from "@/components/molecules";
import { dayjs, type Dayjs } from "@/libs";
import {
  saveSessionMutationOptions,
  sessionsQueryOptions,
} from "../apis/sessions";
import { MAX_SESSION_HOURS, MIN_SESSION_MINUTES } from "../constants/options";
import { useRoster, type BookingRequest } from "../context/roster-context";
import { useNow } from "../hooks/useNow";
import type { Session, SessionStatus } from "../models/roster";
import { sessionAccess } from "../utils/permissions";
import { isTrainer } from "../utils/trainers";
import {
  DATE,
  addDays,
  dayStartIso,
  editableUntil,
  formatRange,
  inTz,
  monthBounds,
  openingHours,
  todayIn,
  trainerWindow,
  zonedIso,
} from "../utils/time";

type Values = {
  memberId: string;
  sessionTypeId?: string;
  branchId?: string;
  date: Dayjs;
  time: [Dayjs, Dayjs];
  title?: string;
  note?: string;
  completed: boolean;
};

const TIME = "HH:mm";
const asTime = (hhmm: string) => dayjs(`2000-01-01 ${hhmm}`);

// Sessions that occupy a trainer's time.
const occupies = (s: Session) =>
  s.status === "scheduled" || s.status === "completed";

const overlaps = (s: Session, startsAt: string, endsAt: string) =>
  Date.parse(s.starts_at) < Date.parse(endsAt) &&
  Date.parse(s.ends_at) > Date.parse(startsAt);

export function SessionDrawer({
  request,
  onClose,
}: {
  request: BookingRequest | null;
  onClose: () => void;
}) {
  const screens = Grid.useBreakpoint();
  const editing = request?.session;

  return (
    <Drawer
      open={!!request}
      onClose={onClose}
      title={editing ? "Session" : "Book session"}
      placement={screens.md === false ? "bottom" : "right"}
      size={screens.md === false ? "85%" : 440}
      destroyOnHidden
    >
      {request && (
        <SessionForm key={request.nonce} request={request} onDone={onClose} />
      )}
    </Drawer>
  );
}

export function SessionForm({
  request,
  onDone,
}: {
  request: BookingRequest;
  onDone: () => void;
}) {
  const ctx = useRoster();
  const {
    center,
    isOwner,
    meId,
    directory,
    memberById,
    branches,
    branchById,
    memberBranches,
    sessionTypes,
    typeById,
    memberSessionTypes,
  } = ctx;
  const tz = center.timezone;
  const hours = openingHours(center);
  const existing = request.session;
  const access = existing ? sessionAccess(existing, ctx) : null;
  const readOnly = !!access && !access.canEdit;
  const now = useNow();
  const save = useMutation(saveSessionMutationOptions(center.id));
  const [form] = Form.useForm<Values>();
  const [restored, setRestored] = useState(false);

  const memberId =
    Form.useWatch("memberId", form) ??
    existing?.member_id ??
    (isOwner ? "" : meId);
  const date = Form.useWatch("date", form);
  const time = Form.useWatch("time", form);
  const member = memberById.get(memberId);
  const memberIsOwner = member?.role === "owner";
  const anyBranch = ctx.anyBranchIds.has(memberId);

  const assignedBranchIds = new Set(
    memberBranches
      .filter((mb) => mb.member_id === memberId)
      .map((mb) => mb.branch_id),
  );
  const activeBranches = branches.filter(
    (b) => !b.archived_at || b.id === existing?.branch_id,
  );
  const branchChoices = isOwner
    ? activeBranches
    : activeBranches.filter(
        (b) =>
          anyBranch ||
          assignedBranchIds.has(b.id) ||
          b.id === existing?.branch_id,
      );
  // A trainer with no session types assigned can teach all of them.
  const assignedTypeIds = new Set(
    memberSessionTypes
      .filter((mst) => mst.member_id === memberId)
      .map((mst) => mst.session_type_id),
  );
  const typeChoices = assignedTypeIds.size
    ? sessionTypes.filter(
        (t) => assignedTypeIds.has(t.id) || t.id === existing?.session_type_id,
      )
    : sessionTypes;
  const notAssignedBranch = (id: string) =>
    isOwner && !memberIsOwner && !anyBranch && !assignedBranchIds.has(id);

  const today = todayIn(tz);
  const month = monthBounds(today);
  const trainer = trainerWindow(center);
  const earliestDate = isOwner ? month.first : trainer.earliestDate;
  const latestDate = month.last;
  const originalDate = existing
    ? inTz(existing.starts_at, tz).format(DATE)
    : null;

  const dateStr = date?.format(DATE);
  const dayQuery = useQuery({
    ...sessionsQueryOptions(
      center.id,
      dayStartIso(dateStr ?? today, tz),
      dayStartIso(addDays(dateStr ?? today, 1), tz),
    ),
    enabled: !!dateStr,
  });

  const startsAt =
    dateStr && time?.[0] ? zonedIso(dateStr, time[0].format(TIME), tz) : null;
  const endsAt =
    dateStr && time?.[1] ? zonedIso(dateStr, time[1].format(TIME), tz) : null;
  const conflict: Session | undefined =
    startsAt && endsAt
      ? (dayQuery.data ?? []).find(
          (s) =>
            s.id !== existing?.id &&
            s.member_id === memberId &&
            occupies(s) &&
            overlaps(s, startsAt, endsAt),
        )
      : undefined;
  const hasStarted = !!startsAt && new Date(startsAt).getTime() <= now;
  const inactiveStatus =
    existing &&
    !restored &&
    (existing.status === "cancelled" || existing.status === "missed")
      ? (existing.status as SessionStatus)
      : null;

  const sessionLength = Math.max(
    center.default_session_min,
    MIN_SESSION_MINUTES,
  );
  const initialValues: Partial<Values> = existing
    ? {
        memberId: existing.member_id,
        sessionTypeId: existing.session_type_id ?? undefined,
        branchId: existing.branch_id,
        date: dayjs(originalDate),
        time: [
          asTime(inTz(existing.starts_at, tz).format(TIME)),
          asTime(inTz(existing.ends_at, tz).format(TIME)),
        ],
        title: existing.title ?? undefined,
        note: existing.note ?? undefined,
        completed: existing.status === "completed",
      }
    : (() => {
        const start = asTime(request.start ?? hours.open);
        const requested = request.date ?? today;
        const onlyType = typeChoices.length === 1 ? typeChoices[0] : null;
        return {
          memberId:
            request.memberId ??
            (isOwner && !memberById.get(meId)?.also_trainer ? undefined : meId),
          sessionTypeId: onlyType?.id,
          title: onlyType?.name,
          branchId:
            request.branchId ??
            (branchChoices.length === 1 ? branchChoices[0].id : undefined),
          date: dayjs(
            requested < earliestDate || requested > latestDate
              ? today
              : requested,
          ),
          time: [start, start.add(sessionLength, "minute")],
          completed: false,
        };
      })();

  if (!isOwner && !existing && !branchChoices.length) {
    return (
      <EmptyState
        icon={CalendarOff}
        title='You aren’t assigned to a branch yet'
        description='Ask the owner of this center to assign you a branch.'
      />
    );
  }

  // A session type fills in the title, unless the title was typed by hand.
  const onTypeChange = (typeId: string | undefined) => {
    const previous = form.getFieldValue("sessionTypeId") as string | undefined;
    const title = (
      (form.getFieldValue("title") as string | undefined) ?? ""
    ).trim();
    const previousName = previous ? typeById.get(previous)?.name : undefined;
    if (!title || title === previousName)
      form.setFieldValue(
        "title",
        typeId ? typeById.get(typeId)?.name : undefined,
      );
  };

  const onFinish = (values: Values) => {
    const day = values.date.format(DATE);
    const [start, end] = values.time;
    save.mutate(
      {
        id: existing?.id,
        member_id: values.memberId,
        branch_id: values.branchId as string,
        session_type_id: values.sessionTypeId ?? null,
        starts_at: zonedIso(day, start.format(TIME), tz),
        ends_at: zonedIso(day, end.format(TIME), tz),
        title: values.title?.trim() || null,
        note: values.note?.trim() || null,
        status:
          values.completed && hasStarted
            ? "completed"
            : (inactiveStatus ?? "scheduled"),
      },
      { onSuccess: onDone },
    );
  };

  const disabledDate = (d: Dayjs) => {
    const value = d.format(DATE);
    if (value === originalDate) return false;
    return value < earliestDate || value > latestDate;
  };

  return (
    <Form
      form={form}
      layout='vertical'
      initialValues={initialValues}
      onFinish={onFinish}
      disabled={readOnly}
    >
      {access?.reason && (
        <Alert
          type='warning'
          showIcon
          icon={<Lock />}
          className='mb-4'
          message={access.reason}
        />
      )}
      {existing &&
        !readOnly &&
        !isOwner &&
        hasStarted &&
        center.past_edit_days > 0 && (
          <p className='-mt-1 mb-4 text-xs text-muted-foreground'>
            Editable until {editableUntil(center, existing.starts_at)}
          </p>
        )}
      {inactiveStatus && (
        <Alert
          type='info'
          showIcon
          className='mb-4'
          message={`This session is ${inactiveStatus}.`}
          action={
            !readOnly && (
              <Button size='small' onClick={() => setRestored(true)}>
                Restore
              </Button>
            )
          }
        />
      )}

      {isOwner ? (
        <Form.Item
          name='memberId'
          label='Trainer'
          rules={[{ required: true, message: "Choose a trainer" }]}
        >
          <Select
            showSearch
            placeholder='Choose a trainer'
            optionFilterProp='label'
            options={directory
              .filter(
                (m) =>
                  (isTrainer(m) && m.status !== "inactive") ||
                  m.id === existing?.member_id,
              )
              .map((m) => ({ value: m.id, label: m.display_name }))}
          />
        </Form.Item>
      ) : (
        <Form.Item name='memberId' hidden>
          <Input />
        </Form.Item>
      )}

      <Form.Item
        name='sessionTypeId'
        label='Session type'
        extra={
          !sessionTypes.length && isOwner
            ? "Add session types in the Session types tab to fill in titles."
            : undefined
        }
      >
        <Select
          allowClear
          showSearch
          placeholder={typeChoices.length ? "Choose a type" : "No types yet"}
          optionFilterProp='label'
          disabled={!typeChoices.length}
          onChange={onTypeChange}
          options={typeChoices.map((t) => ({ value: t.id, label: t.name }))}
        />
      </Form.Item>

      <Form.Item
        name='branchId'
        label='Branch'
        rules={[{ required: true, message: "Choose a branch" }]}
      >
        <Select
          showSearch
          placeholder='Choose a branch'
          optionFilterProp='label'
          options={branchChoices.map((b) => ({
            value: b.id,
            label: `${b.code} · ${b.name}${notAssignedBranch(b.id) ? " (not assigned)" : ""}`,
          }))}
        />
      </Form.Item>

      <Form.Item
        name='date'
        label='Date'
        rules={[{ required: true }]}
        extra={`Sessions can be booked from ${dayjs(earliestDate).format("MMM D")} to ${dayjs(latestDate).format("MMM D")} (this month).`}
      >
        <DatePicker
          className='w-full'
          format='ddd, MMM D, YYYY'
          allowClear={false}
          disabledDate={disabledDate}
        />
      </Form.Item>

      <Form.Item
        name='time'
        label='Time'
        extra={`At least 1 hour. Open ${hours.open}–${hours.close === "24:00" ? "midnight" : hours.close}.`}
        rules={[
          { required: true, message: "Choose a start and end time" },
          {
            validator: (_rule, value: [Dayjs, Dayjs] | undefined) => {
              if (!value?.[0] || !value[1]) return Promise.resolve();
              const [s, e] = value;
              const minutes = e.diff(s, "minute");
              if (s.format(TIME) < hours.open)
                return Promise.reject(new Error(`Opens at ${hours.open}`));
              if (e.format(TIME) > hours.close)
                return Promise.reject(new Error(`Closes at ${hours.close}`));
              if (minutes < MIN_SESSION_MINUTES)
                return Promise.reject(new Error("At least 1 hour"));
              if (minutes > MAX_SESSION_HOURS * 60)
                return Promise.reject(
                  new Error(`At most ${MAX_SESSION_HOURS} hours`),
                );
              return Promise.resolve();
            },
          },
        ]}
      >
        <TimePicker.RangePicker
          className='w-full'
          format={TIME}
          minuteStep={5}
          needConfirm={false}
          allowClear={false}
          order
        />
      </Form.Item>

      {conflict && !readOnly && (
        <Alert
          type='warning'
          showIcon
          icon={<AlertTriangle />}
          className='mb-4'
          message={`${memberId === meId ? "You're" : `${member?.display_name ?? "They"} is`} already at ${branchById.get(conflict.branch_id)?.code ?? ""} from ${formatRange(conflict.starts_at, conflict.ends_at, tz)}`}
        />
      )}

      <Form.Item name='title' label='Title' rules={[{ max: 120 }]}>
        <Input
          maxLength={120}
          placeholder='Defaults to the session type, e.g. Piano lesson'
        />
      </Form.Item>
      <Form.Item name='note' label='Note' rules={[{ max: 1000 }]}>
        <Input.TextArea
          maxLength={1000}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      </Form.Item>

      <div className='mb-4 flex items-start justify-between gap-3 rounded-md border bg-surface-muted p-3'>
        <div>
          <div className='text-sm text-foreground'>Mark as completed</div>
          <p className='text-xs text-muted-foreground'>
            {hasStarted
              ? "Turn on once the session has taken place."
              : "Available once the session has started."}
          </p>
        </div>
        <Form.Item name='completed' valuePropName='checked' noStyle>
          <Switch
            aria-label='Mark as completed'
            disabled={readOnly || !hasStarted}
          />
        </Form.Item>
      </div>

      {!readOnly && (
        <div className='flex justify-end gap-2'>
          <Button onClick={onDone}>Close</Button>
          <Button
            type='primary'
            htmlType='submit'
            loading={save.isPending}
            disabled={!!conflict}
          >
            {existing ? "Save" : "Book"}
          </Button>
        </div>
      )}
    </Form>
  );
}
