import { useQuery } from "@tanstack/react-query";
import { useFlowApp } from "@/context";
import { sessionEventsQueryOptions } from "../apis/sessions";
import { useRoster } from "../context/roster-context";
import type { SessionEvent } from "../models/roster";

const ACTION_LABEL: Record<string, string> = {
  booked: "Booked",
  edited: "Edited",
  completed: "Completed",
  checkout_updated: "Checkout updated",
  reopened: "Reopened",
  cancelled: "Cancelled",
  missed: "Marked missed",
  restored: "Restored",
};

// A session's history, newest first, and a "Completed by you" style label.
export function useSessionEvents(sessionId: string) {
  const { center, directory } = useRoster();
  const { user } = useFlowApp();
  const events = useQuery(sessionEventsQueryOptions(center.id, sessionId));

  const actorName = (actorId: string | null) =>
    actorId === user.id
      ? "you"
      : (directory.find((m) => m.user_id === actorId)?.display_name ??
        "someone");
  const describe = (event: SessionEvent) =>
    `${ACTION_LABEL[event.action] ?? event.action} by ${actorName(event.actor_id)}`;

  return { events: events.data ?? [], isLoading: events.isLoading, describe };
}
