import { Wallet } from "lucide-react";
import type { AppManifest } from "@/types";

export default {
  id: "ledger",
  name: "Ledger",
  tagline: "Track your daily expenses",
  description:
    "Write down what you spend each day and see where your money goes.",
  icon: Wallet,
  category: "Utilities",
  version: "0.27.7",
  load: () => import("./LedgerApp"),
} satisfies AppManifest;
