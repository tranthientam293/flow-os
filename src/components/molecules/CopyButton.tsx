import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "antd";

export function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button size='small' icon={copied ? <Check /> : <Copy />} onClick={copy}>
      {copied ? "Copied" : (label ?? "Copy")}
    </Button>
  );
}
