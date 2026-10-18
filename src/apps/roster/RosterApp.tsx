import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CenteredSpinner } from "@/components/atoms";
import { AppFooter } from "@/components/molecules";
import { useFlowApp } from "@/context";
import {
  membershipsQueryOptions,
  pendingInvitesQueryOptions,
} from "./apis/centers";
import { MySettingsPage, SectionPage } from "./components/pages";
import {
  AddActionProvider,
  CheckoutProvider,
  RegisterCenterModal,
  RosterBottomBar,
  RosterHeader,
} from "./components/organisms";
import {
  DELETED_PATH,
  INCOME_PATH,
  REPEATS_PATH,
  SECTIONS,
  SETTINGS_PATH,
  sectionOf,
} from "./constants/routes";
import { useRosterPaths } from "./hooks/useRosterPaths";

// Routes, relative to /apps/roster:
//   centers[/:centerId/:tab]  centers the user owns (schedule, trainers, branches, settings)
//   work[/:centerId/:tab]     the user's trainer schedule (week, schedule)
//   work/income               the user's completed sessions in a month, with their pay
//   work/repeats              the user's weekly repeats: edit or stop them
//   settings                  the user's profile, preferences, centers and the way back to flowOS
export default function RosterApp() {
  const { user } = useFlowApp();
  const navigate = useNavigate();
  const paths = useRosterPaths();
  const memberships = useQuery(membershipsQueryOptions(user.id));
  const invites = useQuery(pendingInvitesQueryOptions(user.id));
  const [creating, setCreating] = useState(false);

  const list = memberships.data ?? [];
  const inviteList = invites.data ?? [];
  const hasOwned = list.some((m) => m.role === "owner");
  const hasWork = list.some(sectionOf("work").includes);
  const home = paths.section(hasOwned || !hasWork ? "centers" : "work");

  const sectionProps = {
    memberships: list,
    email: user.email ?? "",
    inviteCount: inviteList.length,
    onCreateCenter: () => setCreating(true),
  };

  return (
    <AddActionProvider>
      <CheckoutProvider>
        {/* On phones the navigation moves to the bottom bar; leave room for it. */}
        <div className='flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0'>
          <RosterHeader
            invites={inviteList}
            onJoined={(centerId) => navigate(paths.center("work", centerId))}
          />
          {memberships.isLoading ? (
            <CenteredSpinner />
          ) : (
            <Routes>
              <Route index element={<Navigate replace to={home} />} />
              {SECTIONS.map((s) => (
                <Route key={s.key} path={s.key}>
                  <Route
                    index
                    element={<SectionPage section={s.key} {...sectionProps} />}
                  />
                  {s.key === "work" && (
                    <Route
                      path={INCOME_PATH}
                      element={
                        <SectionPage
                          section={s.key}
                          view='income'
                          {...sectionProps}
                        />
                      }
                    />
                  )}
                  {s.key === "work" && (
                    <Route
                      path={REPEATS_PATH}
                      element={
                        <SectionPage
                          section={s.key}
                          view='repeats'
                          {...sectionProps}
                        />
                      }
                    />
                  )}
                  {s.key === "work" && (
                    <Route
                      path={DELETED_PATH}
                      element={
                        <SectionPage
                          section={s.key}
                          view='deleted'
                          {...sectionProps}
                        />
                      }
                    />
                  )}
                  <Route
                    path=':centerId/:tab?'
                    element={<SectionPage section={s.key} {...sectionProps} />}
                  />
                </Route>
              ))}
              <Route
                path={SETTINGS_PATH}
                element={<MySettingsPage memberships={list} />}
              />
              <Route path='*' element={<Navigate replace to={home} />} />
            </Routes>
          )}
          <RegisterCenterModal
            open={creating}
            onClose={() => setCreating(false)}
            onCreated={(centerId) => {
              setCreating(false);
              navigate(paths.center("centers", centerId, "branches"));
            }}
          />
          <AppFooter />
          <RosterBottomBar />
        </div>
      </CheckoutProvider>
    </AddActionProvider>
  );
}
