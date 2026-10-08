import { useRef, useState, type ComponentRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarOff,
  Lock,
  Repeat,
} from "lucide-react";
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
import { DAY_FORMAT } from "@/constants";
import { dayjs, type Dayjs } from "@/libs";
import {
  bookSessionsMutationOptions,
  saveSessionMutationOptions,
  sessionsQueryOptions,
} from "../../apis/sessions";
import {
  MAX_SESSION_HOURS,
  MIN_SESSION_MINUTES,
} from "../../constants/options";
import { useRoster, type BookingRequest } from "../../context/roster-context";
import { useNow } from "../../hooks/useNow";
import type { Session, SessionStatus } from "../../models/roster";
import { sessionAccess } from "../../utils/permissions";
import { isTrainer } from "../../utils/trainers";
import {
  DATE,
  addDays,
  formatDate,
  dayStartIso,
  editableUntil,
  formatRange,
  inTz,
  monthBounds,
  openingHours,
  todayIn,
  trainerWindow,
  zonedIso,
} from "../../utils/time";
import { SessionView } from "./SessionView";

type Values = {
  memberId: string;
  sessionTypeId?: string;
  branchId?: string;
  date: Dayjs;
  time: [Dayjs, Dayjs];
  title?: string;
  note?: string;
  repeatWeekly: boolean;
};

type TimeRange = [Dayjs | null, Dayjs | null] | null;

const TIME = "HH:mm";
const shortDay = (day: string) => formatDate(day);

// antd types the range picker ref as a single picker; the underlying picker
// also takes the field to focus (0 = start, 1 = end).
type RangePickerFocus = { focus: (index?: number) => void };
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

  return (
    <Drawer
      open={!!request}
      onClose={onClose}
      title={request?.session ? "Session" : "Create session"}
      placement={screens.md === false ? "bottom" : "right"}
      size={screens.md === false ? "85%" : 440}
      destroyOnHidden
    >
      {request && (
        <SessionPanel key={request.nonce} request={request} onDone={onClose} />
      )}
    </Drawer>
  );
}

// An existing session opens on its details; Edit switches to the form. A new
// booking goes straight to the form.
export function SessionPanel({
  request,
  onDone,
}: {
  request: BookingRequest;
  onDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const session = request.session;
  if (session && !editing)
    return (
      <SessionView
        session={session}
        onEdit={() => setEditing(true)}
        onDone={onDone}
      />
    );
  return (
    <SessionForm
      request={request}
      onDone={onDone}
      onBack={session ? () => setEditing(false) : undefined}
    />
  );
}

export function SessionForm({
  request,
  onDone,
  onBack,
}: {
  request: BookingRequest;
  onDone: () => void;
  // Editing an existing session: back to its details instead of closing.
  onBack?: () => void;
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
  const bookWeekly = useMutation(bookSessionsMutationOptions(center.id));
  const [form] = Form.useForm<Values>();
  const timeRef = useRef<ComponentRef<typeof TimePicker.RangePicker>>(null);
  // The start time last shown in the open picker, to tell an hour click from
  // a minute click.
  const pickingStart = useRef<Dayjs | null>(null);

  const memberId =
    Form.useWatch("memberId", form) ??
    existing?.member_id ??
    (isOwner ? "" : meId);
  const date = Form.useWatch("date", form);
  const time = Form.useWatch("time", form);
  const repeatValue = Form.useWatch("repeatWeekly", form);
  const repeatWeekly = !existing && !!repeatValue;
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

  // Repeat every week: the same weekday and time until the end of the month.
  const weeklyDates: string[] = [];
  if (repeatWeekly && dateStr)
    for (let d = dateStr; d <= latestDate; d = addDays(d, 7))
      weeklyDates.push(d);
  const weeklyQuery = useQuery({
    ...sessionsQueryOptions(
      center.id,
      dayStartIso(dateStr ?? today, tz),
      dayStartIso(addDays(latestDate, 1), tz),
      memberId || undefined,
    ),
    enabled: repeatWeekly && !!dateStr && !!memberId,
  });
  const weekly = weeklyDates.map((day) => {
    const s = time?.[0] ? zonedIso(day, time[0].format(TIME), tz) : null;
    const e = time?.[1] ? zonedIso(day, time[1].format(TIME), tz) : null;
    const clash =
      s && e
        ? (weeklyQuery.data ?? []).some(
            (x) => x.member_id === memberId && occupies(x) && overlaps(x, s, e),
          )
        : false;
    return { day, clash };
  });
  const weeklyBookable = weekly.filter((w) => !w.clash).map((w) => w.day);
  const weeklySkipped = weekly.filter((w) => w.clash).map((w) => w.day);
  const inactiveStatus =
    existing &&
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
          repeatWeekly: false,
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
    if (repeatWeekly) {
      bookWeekly.mutate(
        weeklyBookable.map((d) => ({
          member_id: values.memberId,
          branch_id: values.branchId as string,
          session_type_id: values.sessionTypeId ?? null,
          starts_at: zonedIso(d, start.format(TIME), tz),
          ends_at: zonedIso(d, end.format(TIME), tz),
          title: values.title?.trim() || null,
          note: values.note?.trim() || null,
          status: "scheduled",
        })),
        { onSuccess: onDone },
      );
      return;
    }
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
        // Completing goes through the checkout, which records the pay.
        status:
          inactiveStatus ??
          (existing?.status === "completed" ? "completed" : "scheduled"),
      },
      { onSuccess: onDone },
    );
  };

  // Picking the start minute moves straight on to the end time, which is
  // prefilled to keep the session length.
  const onTimeCalendarChange = (
    dates: TimeRange,
    _text: unknown,
    info: { range?: "start" | "end" },
  ) => {
    const next = dates?.[0] ?? null;
    const previous = pickingStart.current;
    pickingStart.current = next;
    if (info.range !== "start" || !next || !previous) return;
    if (next.minute() === previous.minute()) return;
    const [oldStart, oldEnd] = (form.getFieldValue("time") ?? []) as Dayjs[];
    const length =
      oldStart && oldEnd ? oldEnd.diff(oldStart, "minute") : sessionLength;
    form.setFieldValue("time", [
      next,
      next.add(Math.max(length, MIN_SESSION_MINUTES), "minute"),
    ]);
    requestAnimationFrame(() =>
      (timeRef.current as RangePickerFocus | null)?.focus(1),
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
          title={access.reason}
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
      {isOwner ? (
        <Form.Item
          name='memberId'
          label='Trainer'
          rules={[{ required: true, message: "Choose a trainer" }]}
        >
          <Select
            showSearch={{ optionFilterProp: "label" }}
            placeholder='Choose a trainer'
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
          showSearch={{ optionFilterProp: "label" }}
          placeholder={typeChoices.length ? "Choose a type" : "No types yet"}
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
          showSearch={{ optionFilterProp: "label" }}
          placeholder='Choose a branch'
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
        extra={`Sessions can be booked from ${formatDate(earliestDate)} to ${formatDate(latestDate)} (this month).`}
      >
        <DatePicker
          className='w-full'
          format={DAY_FORMAT}
          allowClear={false}
          disabledDate={disabledDate}
        />
      </Form.Item>

      <Form.Item
        name='time'
        label='Time'
        extra={
          <>
            <div>
              At least 1 hour. Open {hours.open}–
              {hours.close === "24:00" ? "midnight" : hours.close}.
            </div>

            {conflict && !readOnly && (
              <Alert
                type='warning'
                showIcon
                icon={<AlertTriangle />}
                className='mt-2'
                title={`${memberId === meId ? "You're" : `${member?.display_name ?? "They"} is`} already at ${branchById.get(conflict.branch_id)?.code ?? ""} from ${formatRange(conflict.starts_at, conflict.ends_at, tz)}`}
              />
            )}
          </>
        }
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
          ref={timeRef}
          className='w-full'
          onOpenChange={(open) => {
            pickingStart.current = open
              ? ((form.getFieldValue("time") as Dayjs[] | undefined)?.[0] ??
                null)
              : null;
          }}
          onCalendarChange={onTimeCalendarChange}
          format={TIME}
          minuteStep={5}
          needConfirm={false}
          allowClear={false}
          order
        />
      </Form.Item>

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

      {!existing && (
        <div className='mb-4 rounded-md border bg-surface-muted p-3'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <div className='flex items-center gap-1.5 text-sm text-foreground'>
                <Repeat className='size-3.5' />
                Repeat every week
              </div>
              <p className='text-xs text-muted-foreground'>
                {date
                  ? `Books this time every ${date.format("dddd")} until ${shortDay(latestDate)}.`
                  : "Books this time on the same weekday until the end of the month."}
              </p>
            </div>
            <Form.Item name='repeatWeekly' valuePropName='checked' noStyle>
              <Switch aria-label='Repeat every week' />
            </Form.Item>
          </div>
          {repeatWeekly && weekly.length > 0 && (
            <div className='mt-2 flex flex-col gap-1 text-xs'>
              <p className='text-foreground-light'>
                {weeklyBookable.length
                  ? `Books ${weeklyBookable.length} ${weeklyBookable.length === 1 ? "session" : "sessions"}: ${weeklyBookable.map(shortDay).join(", ")}.`
                  : "Every date clashes with another session."}
              </p>
              {weeklySkipped.length > 0 && (
                <p className='text-warning'>
                  Skips {weeklySkipped.map(shortDay).join(", ")} (already booked
                  at that time).
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div className='flex items-center gap-2'>
          <Button
            className='ms-auto'
            disabled={false}
            icon={onBack && <ArrowLeft />}
            onClick={onBack ?? onDone}
          >
            {onBack ? "Back" : "Close"}
          </Button>
          <Button
            type='primary'
            htmlType='submit'
            loading={save.isPending || bookWeekly.isPending}
            disabled={
              repeatWeekly
                ? !weeklyBookable.length || weeklyQuery.isLoading
                : !!conflict
            }
          >
            {existing
              ? "Save"
              : repeatWeekly && weeklyBookable.length > 1
                ? `Book ${weeklyBookable.length} sessions`
                : "Book"}
          </Button>
        </div>
      )}
    </Form>
  );
}
