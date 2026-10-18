import type { ComponentProps } from "react";
import { useMutation } from "@tanstack/react-query";
import { Ban, CircleCheck, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button, Grid, Popconfirm } from "antd";
import { cn } from "@/utils";
import {
  deleteSessionMutationOptions,
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

interface SessionActionsProps {
  session: Session;
  onEdit: () => void;
  /**
   * After an action, e.g. to close the drawer or popup.
   */
  onDone: () => void;
  onView?: () => void;
  iconOnly?: boolean;
}

/**
 * A session's actions: Delete, Cancel, Edit, Restore and Complete. The session
 * drawer shows them with labels (Delete as an icon, then Cancel, on the left;
 * the rest on the right); the calendar popup shows them as text icon buttons
 * on the right, named by their title, plus View to open the drawer.
 */
export function SessionActions({
  session,
  onEdit,
  onDone,
  onView,
  iconOnly = false,
}: SessionActionsProps) {
  const ctx = useRoster();
  const access = sessionAccess(session, ctx);
  const now = useNow();
  const setStatus = useMutation(setSessionStatusMutationOptions(ctx.center.id));
  const reopen = useMutation(reopenSessionMutationOptions(ctx.center.id));
  const remove = useMutation(deleteSessionMutationOptions(ctx.center.id));
  const { openCheckout } = useCheckout();
  const phone = Grid.useBreakpoint().md === false;

  if (!access.canEdit && !onView) return null;

  const started = Date.parse(session.starts_at) <= now;
  const { status } = session;
  const canEdit = access.canEdit;
  const editable = status === "scheduled" || status === "missed";

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
      {canEdit && (
        <Popconfirm
          title='Delete this session?'
          okText='Delete'
          okButtonProps={{ danger: true }}
          onConfirm={() => remove.mutate(session.id, { onSuccess: onDone })}
        >
          <Button
            type='text'
            danger
            size={iconOnly ? (phone ? "large" : "small") : undefined}
            icon={<Trash2 />}
            title='Delete'
            aria-label='Delete session'
            loading={remove.isPending}
          />
        </Popconfirm>
      )}
      {canEdit && status === "scheduled" && (
        <Popconfirm
          title='Cancel this session?'
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
      {canEdit && status === "scheduled" && started && (
        <Button
          icon={<CircleCheck />}
          onClick={() => {
            onDone();
            openCheckout(session, ctx);
          }}
          {...look("Complete", "primary", true)}
          className='hover:text-primary'
        />
      )}
    </div>
  );
}
