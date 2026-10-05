import { createBrowserRouter } from "react-router";
import { CenteredSpinner } from "@/components/atoms";
import { ROUTES } from "@/constants";
import { GuestRoute, ProtectedRoute } from "./Guards";

// Layouts and pages are lazy so each route downloads only its own code. These
// import files directly (not the barrels): a barrel import would pull every
// page into one chunk and undo the split.
export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <CenteredSpinner className='h-dvh' />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            lazy: async () => ({
              Component: (await import("@/layouts/AuthLayout")).AuthLayout,
            }),
            children: [
              {
                path: ROUTES.SIGN_IN,
                lazy: async () => ({
                  Component: (await import("@/components/pages/SignInPage"))
                    .SignInPage,
                }),
              },
              {
                path: ROUTES.SIGN_UP,
                lazy: async () => ({
                  Component: (await import("@/components/pages/SignUpPage"))
                    .SignUpPage,
                }),
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            lazy: async () => ({
              Component: (await import("@/layouts/AppLayout")).AppLayout,
            }),
            children: [
              {
                path: ROUTES.HOME,
                lazy: async () => ({
                  Component: (await import("@/components/pages/OverviewPage"))
                    .OverviewPage,
                }),
              },
              {
                path: ROUTES.STORE,
                lazy: async () => ({
                  Component: (await import("@/components/pages/AppStorePage"))
                    .AppStorePage,
                }),
              },
              {
                path: ROUTES.APP_PATTERN,
                lazy: async () => ({
                  Component: (await import("@/components/pages/AppPage"))
                    .AppPage,
                }),
              },
              {
                path: ROUTES.SETTINGS,
                lazy: async () => ({
                  Component: (await import("@/components/pages/SettingsPage"))
                    .SettingsPage,
                }),
              },
              {
                path: "*",
                lazy: async () => ({
                  Component: (await import("@/components/pages/NotFoundPage"))
                    .NotFoundPage,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
]);
