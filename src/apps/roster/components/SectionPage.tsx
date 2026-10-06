import { useEffect } from "react";
import { Navigate, useParams } from "react-router";
import { useAppStorage } from "@/hooks";
import { STORAGE_KEYS } from "../constants/keys";
import { sectionOf, type RosterSection } from "../constants/routes";
import { useRosterPaths } from "../hooks/useRosterPaths";
import type { Membership } from "../models/roster";
import { AllCentersSchedule } from "./AllCentersSchedule";
import { CenterShell } from "./CenterShell";
import { SectionEmpty } from "./SectionEmpty";

export function SectionPage({
  section,
  memberships,
  email,
  inviteCount,
  onCreateCenter,
}: {
  section: RosterSection;
  memberships: Membership[];
  email: string;
  inviteCount: number;
  onCreateCenter: () => void;
}) {
  const { centerId, tab } = useParams();
  const paths = useRosterPaths();
  const [lastCenterId, setLastCenterId] = useAppStorage<string>(
    STORAGE_KEYS.activeCenterId,
    "",
  );
  const { includes, tabs } = sectionOf(section);
  const list = memberships.filter(includes);
  const membership = list.find((m) => m.center.id === centerId);
  const current = tabs.find((t) => t.key === tab)?.key;

  // Remembered for the Overview tile.
  useEffect(() => {
    if (membership && membership.center.id !== lastCenterId)
      setLastCenterId(membership.center.id);
  }, [membership, lastCenterId, setLastCenterId]);

  if (!list.length)
    return (
      <SectionEmpty
        section={section}
        email={email}
        inviteCount={inviteCount}
        ownsCenter={memberships.some((m) => m.role === "owner")}
        onCreate={onCreateCenter}
      />
    );

  if (!centerId)
    return (
      <AllCentersSchedule
        section={section}
        memberships={list}
        onCreateCenter={onCreateCenter}
      />
    );

  if (!membership) return <Navigate replace to={paths.section(section)} />;

  if (!current)
    return (
      <Navigate
        replace
        to={paths.center(section, membership.center.id, tabs[0].key)}
      />
    );

  return (
    <CenterShell
      key={membership.center.id}
      section={section}
      tab={current}
      membership={membership}
    />
  );
}
