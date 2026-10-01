import { Navigate, Outlet, useLocation } from "react-router";
import { CenteredSpinner } from "@/components/atoms";
import { ROUTES } from "@/constants";
import { useAuth } from "@/context";

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <CenteredSpinner className='h-dvh' />;
  if (!session)
    return (
      <Navigate
        to={ROUTES.SIGN_IN}
        replace
        state={{ from: location.pathname }}
      />
    );
  return <Outlet />;
}

export function GuestRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? ROUTES.HOME;

  if (loading) return <CenteredSpinner className='h-dvh' />;
  if (session) return <Navigate to={from} replace />;
  return <Outlet />;
}
