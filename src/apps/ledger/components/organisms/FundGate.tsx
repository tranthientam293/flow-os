import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { PiggyBank } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button, Spin } from "antd";
import { EmptyState } from "@/components/molecules";
import { useFlowApp } from "@/context";
import { myFundsQueryOptions } from "../../apis/funds";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";
import type { FundSummary } from "../../models/ledger";

interface FundGateProps {
  children: (fund: FundSummary) => ReactNode;
}

// Finds the fund in the URL (:fundId) among the user's funds: a spinner while
// they load, "Fund not found" when it's gone or the user was removed, else
// renders `children` with it.
export function FundGate({ children }: FundGateProps) {
  const { fundId = "" } = useParams();
  const { user } = useFlowApp();
  const paths = useLedgerPaths();
  const navigate = useNavigate();
  const funds = useQuery(myFundsQueryOptions(user.id));
  const fund = useMemo(
    () => funds.data?.find((f) => f.id === fundId),
    [funds, fundId],
  );

  if (funds.isLoading)
    return (
      <div className='flex flex-1 justify-center py-12'>
        <Spin />
      </div>
    );

  if (!fund)
    return (
      <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6'>
        <EmptyState
          icon={PiggyBank}
          title='Fund not found'
          description='It was deleted, or you’re no longer a member.'
          action={
            <Button onClick={() => navigate(paths.funds)}>Back to funds</Button>
          }
          className='flex-1'
        />
      </main>
    );

  return children(fund);
}
