import { createContext, useContext } from "react";
import type { Session } from "../models/roster";
import type { RosterContextValue } from "./roster-context";

export type CheckoutContextValue = {
  // Opens the checkout for a session, in its own center's context.
  openCheckout: (session: Session, ctx: RosterContextValue) => void;
};

export const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used inside CheckoutProvider");
  return ctx;
}
