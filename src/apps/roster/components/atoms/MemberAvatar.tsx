import { cn } from "@/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function MemberAvatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        size === "sm" ? "size-5 text-[9px]" : "size-7 text-[11px]",
      )}
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </span>
  );
}
