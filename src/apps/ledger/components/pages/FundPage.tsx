import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  ReceiptText,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button, Card, Segmented, Spin, Switch } from "antd";
import { EmptyState } from "@/components/molecules";
import { useFlowApp } from "@/context";
import { cn } from "@/utils";
import {
  deleteFundMutationOptions,
  deleteFundTransactionMutationOptions,
  fundMembersQueryOptions,
  fundTransactionsQueryOptions,
  saveFundTransactionMutationOptions,
  updateFundMutationOptions,
} from "../../apis/funds";
import { useConfirmDelete } from "../../hooks/useConfirmDelete";
import { useLedgerPaths } from "../../hooks/useLedgerPaths";
import type {
  FundSummary,
  FundTransaction,
  FundTransactionKind,
} from "../../models/ledger";
import { fundTotals } from "../../utils/funds";
import { formatAmount } from "../../utils/money";
import { BackLink, FundTransactionList } from "../molecules";
import {
  FundGate,
  FundHistoryModal,
  FundModal,
  FundTransactionModal,
} from "../organisms";

export function FundPage() {
  return (
    <FundGate>{(fund) => <FundView key={fund.id} fund={fund} />}</FundGate>
  );
}

// The transaction list shows money in or money out, one at a time.
const TRANSACTION_TABS: { value: FundTransactionKind; label: string }[] = [
  { value: "contribute", label: "In" },
  { value: "spend", label: "Out" },
];

const EMPTY_TEXT: Record<
  FundTransactionKind,
  { title: string; description: string }
> = {
  contribute: {
    title: "No money put in yet",
    description: "Money members put into the fund shows up here.",
  },
  spend: {
    title: "No money used yet",
    description: "Money taken out of the fund shows up here.",
  },
};

type TransactionTarget = {
  session: number;
  kind: FundTransactionKind;
  transaction?: FundTransaction;
};

function FundView({ fund }: { fund: FundSummary }) {
  const { user } = useFlowApp();
  const paths = useLedgerPaths();
  const navigate = useNavigate();
  const isOwner = fund.my_role === "owner";
  const myMemberId = fund.my_member_id;

  const membersQuery = useQuery(fundMembersQueryOptions(user.id, fund.id));
  const transactionsQuery = useQuery(
    fundTransactionsQueryOptions(user.id, fund.id),
  );
  const save = useMutation(
    saveFundTransactionMutationOptions(user.id, fund.id),
  );
  const removeTransaction = useMutation(
    deleteFundTransactionMutationOptions(user.id),
  );
  const updateFund = useMutation(updateFundMutationOptions(user.id, fund.id));
  const deleteFund = useMutation(deleteFundMutationOptions(user.id));
  const { confirmDelete, holder } = useConfirmDelete();

  const [showDeleted, setShowDeleted] = useState(false);
  const [tab, setTab] = useState<FundTransactionKind>("contribute");
  const [editorOpen, setEditorOpen] = useState(false);
  const [target, setTarget] = useState<TransactionTarget>({
    session: 0,
    kind: "contribute",
  });
  // Kept after closing, so the dialog doesn't empty while it animates out.
  const [history, setHistory] = useState<FundTransaction>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fundEditorOpen, setFundEditorOpen] = useState(false);

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );
  const all = useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );
  const totals = useMemo(() => fundTotals(all), [all]);
  // Both tabs' lists, split once; switching tabs doesn't recompute them.
  const byKind = useMemo(() => {
    const lists: Record<FundTransactionKind, FundTransaction[]> = {
      contribute: [],
      spend: [],
    };
    const deleted: Record<FundTransactionKind, number> = {
      contribute: 0,
      spend: 0,
    };
    for (const t of all) {
      if (t.deleted_at) deleted[t.kind] += 1;
      if (showDeleted || !t.deleted_at) lists[t.kind].push(t);
    }
    return { lists, deleted };
  }, [all, showDeleted]);
  // Deleted ones on this tab, for the Show deleted switch.
  const deletedCount = byKind.deleted[tab];
  // Joined members only; invitations don't count until accepted.
  const memberCount = members.filter(
    (m) => !m.removed_at && m.status === "active",
  ).length;

  // Both tabs stay mounted and switching only shows one and hides the other,
  // so a switch never rebuilds a long list. The tab not shown first is built
  // in a background render after the page appears.
  const [mountedAll, setMountedAll] = useState(false);
  const [, startMounting] = useTransition();
  const ready = !membersQuery.isLoading && !transactionsQuery.isLoading;
  useEffect(() => {
    if (ready) startMounting(() => setMountedAll(true));
  }, [ready]);

  // Stable, so the memoized list and rows don't re-render when other page
  // state (a modal, the tab) changes.
  const openEditor = useCallback(
    (kind: FundTransactionKind, transaction?: FundTransaction) => {
      setTarget((prev) => ({ session: prev.session + 1, kind, transaction }));
      setEditorOpen(true);
    },
    [],
  );
  // Only whoever added a transaction edits or deletes it (enforced by RLS
  // too); the owner has no say over other people's.
  const canEdit = useCallback(
    (t: FundTransaction) => t.created_by === myMemberId,
    [myMemberId],
  );
  const editTransaction = useCallback(
    (t: FundTransaction) => openEditor(t.kind, t),
    [openEditor],
  );
  const { mutateAsync: deleteTransactionAsync } = removeTransaction;
  const deleteTransaction = useCallback(
    (t: FundTransaction) =>
      confirmDelete(() => deleteTransactionAsync(t.id), {
        title: "Delete this transaction?",
        content:
          "It no longer counts toward the balance. Its history stays, and members can still see it under Show deleted.",
      }),
    [confirmDelete, deleteTransactionAsync],
  );
  const showHistory = useCallback((t: FundTransaction) => {
    setHistory(t);
    setHistoryOpen(true);
  }, []);

  const loading = !ready;

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-6 pb-6 sm:px-6'>
      {holder}
      <BackLink to={paths.funds}>Funds</BackLink>

      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h1 className='truncate text-base font-medium text-foreground'>
            {fund.name}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {fund.note ||
              (isOwner
                ? "You own this fund."
                : "You’re a member of this fund.")}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <Button
            icon={<Users />}
            title='Members'
            onClick={() => navigate(paths.fundMembers(fund.id))}
          >
            {/* Phones: the icon and count only. */}
            <span className='max-sm:hidden'>Members</span>
            <span className='text-muted-foreground tabular-nums'>
              {membersQuery.isLoading ? fund.member_count : memberCount}
            </span>
          </Button>
          {isOwner && (
            <>
              <Button
                type='text'
                icon={<Pencil />}
                title='Edit fund'
                aria-label='Edit fund'
                onClick={() => setFundEditorOpen(true)}
              />
              <Button
                type='text'
                danger
                icon={<Trash2 />}
                title='Delete fund'
                aria-label='Delete fund'
                onClick={() =>
                  confirmDelete(
                    async () => {
                      await deleteFund.mutateAsync(fund.id);
                      navigate(paths.funds, { replace: true });
                    },
                    {
                      title: `Delete ${fund.name}?`,
                      content:
                        "Its members, transactions and history are deleted for everyone. This can’t be undone.",
                    },
                  )
                }
              />
            </>
          )}
        </div>
      </div>

      <Card classNames={{ body: "flex flex-col gap-4 p-4 sm:p-5" }}>
        <div>
          <p className='text-xs text-muted-foreground'>Balance</p>
          <p
            className={cn(
              "text-2xl font-semibold tabular-nums",
              totals.fund.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {formatAmount(loading ? fund.balance : totals.fund.balance)}
          </p>
        </div>
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div>
            <p className='text-xs text-muted-foreground'>Put in</p>
            <p className='font-medium text-brand-strong tabular-nums'>
              {formatAmount(
                loading ? fund.contributed : totals.fund.contributed,
              )}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Used</p>
            <p className='font-medium text-destructive tabular-nums'>
              {formatAmount(loading ? fund.spent : totals.fund.spent)}
            </p>
          </div>
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <Button
            type='primary'
            icon={<ArrowDownLeft />}
            disabled={loading}
            onClick={() => openEditor("contribute")}
            className='max-sm:h-11'
          >
            Put money in
          </Button>
          <Button
            icon={<ArrowUpRight />}
            disabled={loading}
            onClick={() => openEditor("spend")}
            className='max-sm:h-11'
          >
            Use money
          </Button>
        </div>
      </Card>

      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-sm font-medium text-foreground'>Transactions</h2>
          {deletedCount > 0 && (
            <label className='flex cursor-pointer items-center gap-2 text-xs text-foreground-light'>
              <Switch
                size='small'
                checked={showDeleted}
                onChange={setShowDeleted}
              />
              Show deleted ({deletedCount})
            </label>
          )}
        </div>
        <Segmented<FundTransactionKind>
          block
          value={tab}
          onChange={setTab}
          options={TRANSACTION_TABS}
        />
        {loading ? (
          <div className='flex justify-center py-12'>
            <Spin />
          </div>
        ) : (
          TRANSACTION_TABS.map(
            ({ value }) =>
              (value === tab || mountedAll) && (
                <div key={value} hidden={value !== tab}>
                  {byKind.lists[value].length ? (
                    <FundTransactionList
                      transactions={byKind.lists[value]}
                      members={memberById}
                      canEdit={canEdit}
                      onEdit={editTransaction}
                      onDelete={deleteTransaction}
                      onHistory={showHistory}
                    />
                  ) : (
                    <EmptyState
                      icon={ReceiptText}
                      title={EMPTY_TEXT[value].title}
                      description={EMPTY_TEXT[value].description}
                      className='min-h-40'
                    />
                  )}
                </div>
              ),
          )
        )}
      </section>

      <FundTransactionModal
        key={target.session}
        open={editorOpen}
        kind={target.kind}
        transaction={target.transaction}
        members={members}
        myMemberId={myMemberId}
        saving={save.isPending}
        onClose={() => setEditorOpen(false)}
        onSubmit={(draft) =>
          save.mutate(
            { ...draft, id: target.transaction?.id },
            { onSuccess: () => setEditorOpen(false) },
          )
        }
      />
      <FundHistoryModal
        open={historyOpen}
        transaction={history}
        members={memberById}
        onClose={() => setHistoryOpen(false)}
      />
      <FundModal
        key={`${fund.name}-${fund.note}`}
        open={fundEditorOpen}
        fund={{ name: fund.name, note: fund.note ?? undefined }}
        saving={updateFund.isPending}
        onClose={() => setFundEditorOpen(false)}
        onSubmit={(draft) =>
          updateFund.mutate(draft, {
            onSuccess: () => setFundEditorOpen(false),
          })
        }
      />
    </main>
  );
}
