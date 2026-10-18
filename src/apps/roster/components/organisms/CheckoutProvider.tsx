import { useMemo, useState, type ReactNode } from "react";
import {
  CheckoutContext,
  type CheckoutContextValue,
} from "../../context/checkout-context";
import {
  RosterContext,
  type RosterContextValue,
} from "../../context/roster-context";
import type { Session } from "../../models/roster";
import { CheckoutModal } from "./CheckoutModal";

interface CheckoutProviderProps {
  children: ReactNode;
}

export function CheckoutProvider({ children }: CheckoutProviderProps) {
  const [target, setTarget] = useState<{
    session: Session;
    ctx: RosterContextValue;
  } | null>(null);
  const value = useMemo<CheckoutContextValue>(
    () => ({ openCheckout: (session, ctx) => setTarget({ session, ctx }) }),
    [],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
      {target && (
        <RosterContext.Provider value={target.ctx}>
          <CheckoutModal
            key={target.session.id}
            session={target.session}
            onClose={() => setTarget(null)}
          />
        </RosterContext.Provider>
      )}
    </CheckoutContext.Provider>
  );
}
