import { Languages } from "lucide-react";
import { Button, Dropdown } from "antd";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/constants";
import { useLanguageStore } from "@/stores";
import type { Language } from "@/types";
import { languageShort } from "@/utils";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  return (
    <Dropdown
      trigger={["click"]}
      placement='bottomRight'
      menu={{
        className: "w-52",
        selectable: true,
        selectedKeys: [language],
        items: LANGUAGES.map((option) => ({
          key: option.value,
          label: option.label,
        })),
        onClick: ({ key }) => setLanguage(key as Language),
      }}
    >
      <Button
        shape='round'
        icon={<Languages />}
        className='h-8 px-2.5'
        aria-label={t("language.switch")}
      >
        <span className='font-mono text-xs'>{languageShort(language)}</span>
      </Button>
    </Dropdown>
  );
}
