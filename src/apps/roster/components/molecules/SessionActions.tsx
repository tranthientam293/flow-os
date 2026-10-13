import type { ComponentProps } from "react";
import { useMutation } from "@tanstack/react-query";
import { Ban, CircleCheck, Eye, Pencil, RotateCcw } from "lucide-react";
import { Button, Grid, Popconfirm } from "antd";
import { cn } from "@/utils";
import {
  reopenSessionMutationOptions,
  setSessionStatusMutationOptions,
} from "../../apis/sessions";
import { useCheckout } from "../../context/checkout-context";
import { useRoster } from "../../context/roster-context";
import { useNow } from "../../hooks/useNow";
import type { Session } from "../../models/roster";
import { sessionAccess } from "../../utils/permissions";

type Tone = "neutral" | "danger" | "primary";
type ButtonProps = ComponentProps<typeof Button>;

// A session's actions: Cancel, Edit, Restore and Complete. The session drawer
// shows them with labels (Cancel on the left, the rest on the right); the
// calendar popup shows them as text icon buttons on the right, named by their
// title, plus View to open the drawer.
export function SessionActions({
  session,
  onEdit,
  onDone,
  onView,
  iconOnly = false,
}: {
  session: Session;
  onEdit: () => void;
  // After an action, e.g. to close the drawer or popup.
  onDone: () => void;
  onView?: () => void;
  iconOnly?: boolean;
}) {
  const ctx = useRoster();
  const access = sessionAccess(session, ctx);
  const now = useNow();
  const setStatus = useMutation(setSessionStatusMutationOptions(ctx.center.id));
  const reopen = useMutation(reopenSessionMutationOptions(ctx.center.id));
  const { openCheckout } = useCheckout();
  // Icon buttons get a finger-sized target on phones.
  const phone = Grid.useBreakpoint().md === false;

  if (!access.canEdit && !onView) return null;

  const started = Date.parse(session.starts_at) <= now;
  const { status } = session;
  const canEdit = access.canEdit;
  // Completed and cancelled sessions aren't edited, only restored.
  const editable = status === "scheduled" || status === "missed";

  // Labelled buttons in the drawer; plain text icon buttons in the popup (only
  // Cancel keeps the danger color).
  const look = (text: string, tone: Tone, main = false): ButtonProps =>
    iconOnly
      ? {
          type: "text",
          size: phone ? "large" : "small",
          danger: tone === "danger",
          title: text,
          "aria-label": text,
        }
      : {
          type: main ? "primary" : "default",
          danger: tone === "danger",
          children: text,
        };
  const restore = () =>
    setStatus.mutate(
      { id: session.id, status: "scheduled" },
      { onSuccess: onDone },
    );

  return (
    <div
      className={cn("flex items-center gap-2", iconOnly && "justify-end gap-1")}
    >
      {canEdit && status === "scheduled" && (
        <Popconfirm
          title='Cancel this session?'
          description='It stays on the schedule, marked cancelled. You can restore it later.'
          okText='Cancel session'
          okButtonProps={{ danger: true }}
          cancelText='Keep'
          onConfirm={() =>
            setStatus.mutate(
              { id: session.id, status: "cancelled" },
              { onSuccess: onDone },
            )
          }
        >
          <Button
            icon={<Ban />}
            loading={setStatus.isPending}
            {...look("Cancel", "danger")}
          />
        </Popconfirm>
      )}
      {!iconOnly && <div className='ms-auto' />}
      {onView && (
        <Button icon={<Eye />} onClick={onView} {...look("View", "neutral")} />
      )}
      {canEdit && editable && (
        <Button
          icon={<Pencil />}
          onClick={onEdit}
          {...look("Edit", "neutral")}
        />
      )}
      {/* Back to scheduled. Undoing a completion clears its salary and fees. */}
      {canEdit && status === "completed" && (
        <Popconfirm
          title='Restore to scheduled?'
          description='Its salary and fees are cleared.'
          okText='Restore'
          onConfirm={() => reopen.mutate(session.id, { onSuccess: onDone })}
        >
          <Button
            icon={<RotateCcw />}
            loading={reopen.isPending}
            {...look("Restore", "primary", true)}
          />
        </Popconfirm>
      )}
      {canEdit && (status === "cancelled" || status === "missed") && (
        <Button
          icon={<RotateCcw />}
          loading={setStatus.isPending}
          onClick={restore}
          {...look("Restore", "primary", !editable)}
        />
      )}
      {/* Completing records the salary and fees once it has taken place. */}
      {canEdit && status === "scheduled" && started && (
        <Button
          icon={<CircleCheck />}
          onClick={() => {
            onDone();
            openCheckout(session, ctx);
          }}
          {...look("Complete", "primary", true)}
        />
      )}
    </div>
  );
}
