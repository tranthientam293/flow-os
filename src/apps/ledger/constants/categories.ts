import {
  ArrowRightLeft,
  Car,
  CircleEllipsis,
  Clapperboard,
  Droplet,
  Dumbbell,
  Flame,
  Gift,
  GraduationCap,
  Hammer,
  HandPlatter,
  HeartPulse,
  House,
  type LucideIcon,
  PartyPopper,
  PawPrint,
  Percent,
  ReceiptText,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkles,
  Stethoscope,
  Ticket,
  TrendingUp,
  Tv,
  Users,
  Utensils,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";

// Tailwind color families for category badges.
export type CategoryTone =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "slate";

// Badge background and icon color per tone, light and dark. Written out in
// full so Tailwind finds the classes.
export const CATEGORY_TONE_CLASS: Record<CategoryTone, string> = {
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  yellow:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  lime: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  indigo:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  fuchsia:
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

// Chart color per tone (Tailwind's 500 step), for the category doughnut;
// the same family as the badge.
export const CATEGORY_TONE_COLOR: Record<CategoryTone, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  slate: "#64748b",
};

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  // Its badge color; siblings and their parent each get a different one.
  tone: CategoryTone;
  children?: Omit<ExpenseCategory, "children">[];
}

// Expense categories, modeled on Money Lover's defaults. A parent can be
// picked on its own or through one of its children. Ids are stored with each
// expense, so never change one once shipped.
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "food", name: "Food & Beverage", icon: Utensils, tone: "orange" },
  {
    id: "transportation",
    name: "Transportation",
    icon: Car,
    tone: "blue",
    children: [
      {
        id: "vehicle-maintenance",
        name: "Vehicle Maintenance",
        icon: Wrench,
        tone: "indigo",
      },
    ],
  },
  {
    id: "bills",
    name: "Bills & Utilities",
    icon: ReceiptText,
    tone: "teal",
    children: [
      { id: "rentals", name: "Rentals", icon: House, tone: "rose" },
      { id: "water-bill", name: "Water Bill", icon: Droplet, tone: "sky" },
      {
        id: "phone-bill",
        name: "Phone Bill",
        icon: Smartphone,
        tone: "violet",
      },
      {
        id: "electricity-bill",
        name: "Electricity Bill",
        icon: Zap,
        tone: "yellow",
      },
      { id: "gas-bill", name: "Gas Bill", icon: Flame, tone: "red" },
      {
        id: "television-bill",
        name: "Television Bill",
        icon: Tv,
        tone: "indigo",
      },
      { id: "internet-bill", name: "Internet Bill", icon: Wifi, tone: "cyan" },
      {
        id: "other-bills",
        name: "Other Utility Bills",
        icon: ReceiptText,
        tone: "emerald",
      },
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: ShoppingBag,
    tone: "pink",
    children: [
      {
        id: "personal-items",
        name: "Personal Items",
        icon: Shirt,
        tone: "purple",
      },
      { id: "houseware", name: "Houseware", icon: Sofa, tone: "amber" },
      { id: "makeup", name: "Makeup", icon: Sparkles, tone: "fuchsia" },
    ],
  },
  {
    id: "family",
    name: "Family",
    icon: Users,
    tone: "green",
    children: [
      {
        id: "home-maintenance",
        name: "Home Maintenance",
        icon: Hammer,
        tone: "amber",
      },
      {
        id: "home-services",
        name: "Home Services",
        icon: HandPlatter,
        tone: "lime",
      },
      { id: "pets", name: "Pets", icon: PawPrint, tone: "orange" },
    ],
  },
  {
    id: "health",
    name: "Health & Fitness",
    icon: HeartPulse,
    tone: "red",
    children: [
      {
        id: "medical",
        name: "Medical Check-up",
        icon: Stethoscope,
        tone: "sky",
      },
      { id: "fitness", name: "Fitness", icon: Dumbbell, tone: "emerald" },
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: PartyPopper,
    tone: "violet",
    children: [
      {
        id: "streaming",
        name: "Streaming Service",
        icon: Clapperboard,
        tone: "red",
      },
      { id: "fun-money", name: "Fun Money", icon: Ticket, tone: "yellow" },
    ],
  },
  { id: "education", name: "Education", icon: GraduationCap, tone: "indigo" },
  { id: "insurances", name: "Insurances", icon: ShieldCheck, tone: "cyan" },
  { id: "gifts", name: "Gifts & Donations", icon: Gift, tone: "rose" },
  { id: "investment", name: "Investment", icon: TrendingUp, tone: "emerald" },
  { id: "pay-interest", name: "Pay Interest", icon: Percent, tone: "lime" },
  {
    id: "outgoing-transfer",
    name: "Outgoing Transfer",
    icon: ArrowRightLeft,
    tone: "sky",
  },
  { id: "other", name: "Other Expense", icon: CircleEllipsis, tone: "slate" },
];

// Every category, parents and children, by id.
export const CATEGORY_BY_ID = new Map<string, ExpenseCategory>(
  EXPENSE_CATEGORIES.flatMap((parent) => [
    [parent.id, parent] as const,
    ...(parent.children ?? []).map((c) => [c.id, c] as const),
  ]),
);

// The top-level category each category rolls up to (itself for a parent).
export const PARENT_CATEGORY = new Map<string, ExpenseCategory>(
  EXPENSE_CATEGORIES.flatMap((parent) => [
    [parent.id, parent] as const,
    ...(parent.children ?? []).map((c) => [c.id, parent] as const),
  ]),
);
