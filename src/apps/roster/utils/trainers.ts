import type { DirectoryMember, Member } from "../models/roster";

// Trainers are invited members, plus the owner when they include themselves.
export const isTrainer = (
  m: Pick<Member | DirectoryMember, "role" | "also_trainer">,
) => m.role === "trainer" || m.also_trainer;
