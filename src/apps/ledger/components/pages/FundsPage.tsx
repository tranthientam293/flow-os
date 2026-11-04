import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, PiggyBank, Plus, Users } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button, Spin } from "antd";
import { Badge } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { useFlowApp } from "@/context";
import { cn } from "@/utils";
import {
  createFundMutationOptions,
  myFundsQueryOptions,
} from "../../apis/funds";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";
import { formatAmount } from "../../utils/money";
import { PageTitle } from "../molecules";
import { FundInvites, FundModal } from "../organisms";

export function FundsPage() {
  const { user } = useFlowApp();
  const paths = useLedgerPaths();
  const navigate = useNavigate();
  const funds = useQuery(myFundsQueryOptions(user.id));
  const create = useMutation(createFundMutationOptions(user.id));
  const [open, setOpen] = useState(false);
  // Bumped on each open so the modal starts empty.
  const [session, setSession] = useState(0);

  const openCreate = () => {
    setSession((n) => n + 1);
    setOpen(true);
  };

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-6 pb-6 sm:px-6'>
      <div className='flex items-start justify-between gap-3'>
        <PageTitle
          title='Funds'
          description='Money you share with others: who put in what, and where it went.'
        />
        <Button type='primary' icon={<Plus />} onClick={openCreate}>
          New fund
        </Button>
      </div>

      <FundInvites />

      {funds.isLoading ? (
        <div className='flex justify-center py-12'>
          <Spin />
        </div>
      ) : funds.data?.length ? (
        <ul className='flex flex-col gap-3'>
          {funds.data.map((f) => (
            <li key={f.id}>
              <Link
                to={paths.fund(f.id)}
                className='flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50'
              >
                <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong'>
                  <PiggyBank className='size-4.5' />
                </span>
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='flex items-center gap-2'>
                    <span className='truncate text-sm font-medium text-foreground'>
                      {f.name}
                    </span>
                    {f.my_role === "owner" && (
                      <Badge variant='brand'>Owner</Badge>
                    )}
                  </span>
                  <span className='flex items-center gap-1 truncate text-xs text-muted-foreground'>
                    <Users className='size-3' />
                    {f.member_count}{" "}
                    {f.member_count === 1 ? "member" : "members"}
                    {f.note && ` · ${f.note}`}
                  </span>
                </span>
                <span className='flex shrink-0 flex-col items-end'>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      f.balance < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {formatAmount(f.balance)}
                  </span>
                  <span className='text-xs text-muted-foreground'>balance</span>
                </span>
                <ChevronRight className='size-4 shrink-0 text-muted-foreground' />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={PiggyBank}
          title='No funds yet'
          description='Create a fund to pool money with friends or family. You’ll be its owner and can invite people by email.'
          action={
            <Button icon={<Plus />} onClick={openCreate}>
              Create a fund
            </Button>
          }
          className='flex-1'
        />
      )}

      <FundModal
        key={session}
        open={open}
        saving={create.isPending}
        onClose={() => setOpen(false)}
        onSubmit={(draft) =>
          create.mutate(draft, {
            onSuccess: (fundId) => {
              setOpen(false);
              navigate(paths.fund(fundId));
            },
          })
        }
      />
    </main>
  );
}
