import { createBrowserRouter } from "react-router";
import { LoadingScreen } from "@/components/molecules";
import { ROUTES } from "@/constants";
import { GuestRoute, ProtectedRoute } from "./Guards";
import { appLoader } from "./loaders";

export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <LoadingScreen />,
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
        loader: appLoader,
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
