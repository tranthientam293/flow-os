import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { useFlowApp } from "@/context";
import {
  fundMembersQueryOptions,
  fundTransactionsQueryOptions,
} from "../../apis/funds";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";
import type { FundSummary } from "../../models/ledger";
import { fundTotals } from "../../utils/funds";
import { BackLink, PageTitle } from "../molecules";
import { FundGate, FundMembersPanel } from "../organisms";

export function FundMembersPage() {
  return (
    <FundGate>{(fund) => <MembersView key={fund.id} fund={fund} />}</FundGate>
  );
}

function MembersView({ fund }: { fund: FundSummary }) {
  const { user } = useFlowApp();
  const paths = useLedgerPaths();
  const isOwner = fund.my_role === "owner";
  const members = useQuery(fundMembersQueryOptions(user.id, fund.id));
  const transactions = useQuery(fundTransactionsQueryOptions(user.id, fund.id));
  const totals = useMemo(
    () => fundTotals(transactions.data ?? []).byMember,
    [transactions.data],
  );

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-6 pb-6 sm:px-6'>
      <BackLink to={paths.fund(fund.id)}>{fund.name}</BackLink>
      <PageTitle
        title='Members'
        description={
          isOwner
            ? `Who's in ${fund.name}, and what each put in and used.`
            : `Who's in ${fund.name}. Only the owner adds or removes people.`
        }
      />
      {members.isLoading || transactions.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spin />
        </div>
      ) : (
        <FundMembersPanel
          fundId={fund.id}
          members={members.data ?? []}
          totals={totals}
          myMemberId={fund.my_member_id}
          isOwner={isOwner}
        />
      )}
    </main>
  );
}
