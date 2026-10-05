import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "antd";
import { useTranslation } from "react-i18next";

export function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button size='small' icon={copied ? <Check /> : <Copy />} onClick={copy}>
      {copied ? t("common.copied") : (label ?? t("common.copy"))}
    </Button>
  );
}
