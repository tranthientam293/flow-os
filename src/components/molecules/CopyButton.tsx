import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "antd";
import { notify } from "@/libs";
import { copyText } from "@/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (await copyText(value)) setCopied(true);
    else notify.error("Couldn’t copy", "Select the text and copy it manually.");
  };

  return (
    <Button size='small' icon={copied ? <Check /> : <Copy />} onClick={copy}>
      {copied ? "Copied" : (label ?? "Copy")}
    </Button>
  );
}
