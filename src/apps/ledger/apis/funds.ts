import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient, supabase } from "@/libs";
import { LEDGER_KEYS } from "../constants/keys";
import type {
  FundDraft,
  FundInvite,
  FundMember,
  FundSummary,
  FundTransaction,
  FundTransactionDraft,
  FundTransactionRevision,
} from "../models/ledger";
import { check } from "../utils/errors";

// Dates are stored as plain days (YYYY-MM-DD), in the user's local calendar.
const DAY = "YYYY-MM-DD";

// Rows per request (Supabase's default cap).
const PAGE = 1000;

const refreshFunds = (userId: string) =>
  queryClient.invalidateQueries({ queryKey: LEDGER_KEYS.funds(userId) });

// The funds the user is in, newest first, with balance and totals. Also links
// member rows added by the user's email to their account.
export const myFundsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: LEDGER_KEYS.funds(userId),
    queryFn: async (): Promise<FundSummary[]> =>
      check(await supabase.rpc("ledger_my_funds")) as FundSummary[],
  });

// Invitations waiting for the user, newest first, with who sent them.
export const myFundInvitesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: LEDGER_KEYS.fundInvites(userId),
    queryFn: async (): Promise<FundInvite[]> =>
      check(await supabase.rpc("ledger_my_fund_invites")),
  });

// Joins the fund; returns its id.
export const acceptFundInviteMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (memberId: string): Promise<string> =>
      check(
        await supabase.rpc("ledger_accept_fund_invite", {
          p_member_id: memberId,
        }),
      ),
    onSuccess: () => refreshFunds(userId),
    meta: { successMessage: "You joined", errorMessage: "Could not join" },
  });

// The owner can invite the user again later.
export const declineFundInviteMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (memberId: string) => {
      check(
        await supabase.rpc("ledger_decline_fund_invite", {
          p_member_id: memberId,
        }),
      );
    },
    onSuccess: () => refreshFunds(userId),
    meta: {
      successMessage: "Invitation declined",
      errorMessage: "Could not decline",
    },
  });

// Everyone who is or was in the fund (removed members stay for history):
// owner first, then by name.
export const fundMembersQueryOptions = (userId: string, fundId: string) =>
  queryOptions({
    queryKey: LEDGER_KEYS.fundMembers(userId, fundId),
    queryFn: async (): Promise<FundMember[]> => {
      const rows = check(
        await supabase
          .from("ledger_fund_members")
          .select("*")
          .eq("fund_id", fundId)
          .order("display_name"),
      ) as FundMember[];
      return rows.sort(
        (a, b) => Number(b.role === "owner") - Number(a.role === "owner"),
      );
    },
  });

// Every transaction in the fund, deleted ones included (the page hides them
// unless asked), newest day first.
export const fundTransactionsQueryOptions = (userId: string, fundId: string) =>
  queryOptions({
    queryKey: LEDGER_KEYS.fundTransactions(userId, fundId),
    queryFn: async (): Promise<FundTransaction[]> => {
      const rows: FundTransaction[] = [];
      // The API returns at most PAGE rows per request.
      for (let from = 0; ; from += PAGE) {
        const page = check(
          await supabase
            .from("ledger_fund_transactions")
            .select("*")
            .eq("fund_id", fundId)
            .order("occurred_on", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, from + PAGE - 1),
        ) as FundTransaction[];
        rows.push(...page);
        if (page.length < PAGE) return rows;
      }
    },
  });

// A transaction's history, oldest change first.
export const fundRevisionsQueryOptions = (
  userId: string,
  fundId: string,
  transactionId: string,
) =>
  queryOptions({
    queryKey: LEDGER_KEYS.fundRevisions(userId, fundId, transactionId),
    queryFn: async (): Promise<FundTransactionRevision[]> =>
      check(
        await supabase
          .from("ledger_fund_transaction_revisions")
          .select("*")
          .eq("fund_id", fundId)
          .eq("transaction_id", transactionId)
          .order("created_at"),
      ) as FundTransactionRevision[],
  });

// Creates a fund with the user as its owner; returns its id.
export const createFundMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (draft: FundDraft): Promise<string> =>
      check(
        await supabase.rpc("ledger_create_fund", {
          p_name: draft.name,
          p_note: draft.note ?? null,
        }),
      ),
    onSuccess: () => refreshFunds(userId),
    meta: { successMessage: "Fund created", errorMessage: "Could not create" },
  });

// Owner only.
export const updateFundMutationOptions = (userId: string, fundId: string) =>
  mutationOptions({
    mutationFn: async (draft: FundDraft) => {
      check(
        await supabase
          .from("ledger_funds")
          .update({ name: draft.name, note: draft.note ?? null })
          .eq("id", fundId),
      );
    },
    onSuccess: () => refreshFunds(userId),
    meta: { successMessage: "Fund saved", errorMessage: "Could not save" },
  });

// Owner only. Deletes the fund with its members, transactions and history.
export const deleteFundMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (fundId: string) => {
      const rows = check(
        await supabase.from("ledger_funds").delete().eq("id", fundId).select(),
      );
      if (!rows.length) throw new Error("Only the fund owner can delete it");
    },
    onSuccess: () => refreshFunds(userId),
    meta: { successMessage: "Fund deleted", errorMessage: "Could not delete" },
  });

// Owner only. Adding a removed member's email again brings them back.
export const addFundMemberMutationOptions = (userId: string, fundId: string) =>
  mutationOptions({
    mutationFn: async ({
      email,
      displayName,
    }: {
      email: string;
      displayName?: string;
    }): Promise<string> =>
      check(
        await supabase.rpc("ledger_add_fund_member", {
          p_fund_id: fundId,
          p_email: email,
          p_display_name: displayName ?? null,
        }),
      ),
    onSuccess: () => refreshFunds(userId),
    meta: {
      successMessage: "Invitation sent",
      errorMessage: "Could not invite",
    },
  });

// Owner only. The member's past transactions stay, under their name.
export const removeFundMemberMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (memberId: string) => {
      check(
        await supabase.rpc("ledger_remove_fund_member", {
          p_member_id: memberId,
        }),
      );
    },
    onSuccess: () => refreshFunds(userId),
    meta: {
      // Also cancels an invitation.
      successMessage: "Removed",
      errorMessage: "Could not remove",
    },
  });

const toTransactionRow = (draft: FundTransactionDraft) => ({
  kind: draft.kind,
  member_id: draft.memberId,
  amount: draft.amount,
  note: draft.note ?? null,
  occurred_on: draft.date.format(DAY),
});

// Adds a transaction, or edits it when `id` is given (whoever recorded it, or
// the owner). The database records who did it and keeps the history.
export const saveFundTransactionMutationOptions = (
  userId: string,
  fundId: string,
) =>
  mutationOptions({
    mutationFn: async ({
      id,
      ...draft
    }: FundTransactionDraft & { id?: string }) => {
      if (id) {
        const rows = check(
          await supabase
            .from("ledger_fund_transactions")
            .update(toTransactionRow(draft))
            .eq("id", id)
            .select("id"),
        );
        // RLS hides the row from the update when the user may not edit it.
        if (!rows.length) throw new Error("You can’t edit this transaction");
      } else {
        check(
          await supabase
            .from("ledger_fund_transactions")
            .insert({ ...toTransactionRow(draft), fund_id: fundId }),
        );
      }
    },
    onSuccess: () => refreshFunds(userId),
    meta: { successMessage: "Saved", errorMessage: "Could not save" },
  });

// Marks a transaction deleted; it leaves the balance but keeps its history.
export const deleteFundTransactionMutationOptions = (userId: string) =>
  mutationOptions({
    mutationFn: async (id: string) => {
      const rows = check(
        await supabase
          .from("ledger_fund_transactions")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id)
          .select("id"),
      );
      if (!rows.length) throw new Error("You can’t delete this transaction");
    },
    onSuccess: () => refreshFunds(userId),
    meta: {
      successMessage: "Transaction deleted",
      errorMessage: "Could not delete",
    },
  });
