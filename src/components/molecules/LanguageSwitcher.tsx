import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/atoms";
import { LANGUAGES } from "@/constants";
import { useLanguageStore } from "@/stores";
import type { Language } from "@/types";
import { languageShort } from "@/utils";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='rounded-full px-2.5'
          aria-label={t("language.switch")}
        >
          <Languages />
          <span className='font-mono text-xs'>{languageShort(language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => setLanguage(value as Language)}
        >
          {LANGUAGES.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
