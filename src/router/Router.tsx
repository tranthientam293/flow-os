import { createBrowserRouter } from "react-router";
import {
  AppPage,
  AppStorePage,
  NotFoundPage,
  OverviewPage,
  SettingsPage,
  SignInPage,
  SignUpPage,
} from "@/components/pages";
import { ROUTES } from "@/constants";
import { AppLayout, AuthLayout } from "@/layouts";
import { GuestRoute, ProtectedRoute } from "./Guards";

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.SIGN_IN, element: <SignInPage /> },
          { path: ROUTES.SIGN_UP, element: <SignUpPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.HOME, element: <OverviewPage /> },
          { path: ROUTES.STORE, element: <AppStorePage /> },
          { path: ROUTES.APP_PATTERN, element: <AppPage /> },
          { path: ROUTES.SETTINGS, element: <SettingsPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
