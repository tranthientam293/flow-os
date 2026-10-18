import { useEffect } from "react";
import { Navigate, useParams } from "react-router";
import { useAppStorage } from "@/hooks";
import { STORAGE_KEYS } from "../../constants/keys";
import { sectionOf, type RosterSection } from "../../constants/routes";
import { useRosterPaths } from "../../hooks/useRosterPaths";
import type { Membership } from "../../models/roster";
import {
  CenterList,
  CenterShell,
  WorkShell,
  type WorkView,
} from "../organisms";
import { SectionEmpty } from "../molecules";

interface SectionPageProps {
  section: RosterSection;
  /** My schedule without a center: its Schedule or Income tab. */
  view?: WorkView;
  memberships: Membership[];
  email: string;
  inviteCount: number;
  onCreateCenter: () => void;
}

export function SectionPage({
  section,
  view = "schedule",
  memberships,
  email,
  inviteCount,
  onCreateCenter,
}: SectionPageProps) {
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
    return section === "centers" ? (
      <CenterList
        section={section}
        memberships={list}
        onCreateCenter={onCreateCenter}
      />
    ) : (
      <WorkShell section={section} view={view} memberships={list} />
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
