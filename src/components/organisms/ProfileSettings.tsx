import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Input } from "antd";
import { useTranslation } from "react-i18next";
import { FormField, SettingsPanel } from "@/components/molecules";
import { DISPLAY_NAME_MAX_LENGTH } from "@/constants";
import { useRequiredUser } from "@/context";
import { profileQueryOptions, updateProfileMutationOptions } from "@/apis";
import { formatDate } from "@/libs";

export function ProfileSettings() {
  const user = useRequiredUser();
  const { data: profile } = useQuery(profileQueryOptions(user.id));
  const saved = profile?.display_name ?? "";
  return <ProfileForm key={saved} saved={saved} />;
}

function ProfileForm({ saved }: { saved: string }) {
  const { t } = useTranslation();
  const user = useRequiredUser();
  const update = useMutation(updateProfileMutationOptions(user.id));
  const [name, setName] = useState(saved);
  const dirty = name !== saved;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({ display_name: name.trim() || null });
  };

  return (
    <form onSubmit={onSubmit}>
      <SettingsPanel
        title={t("settings.profile.title")}
        description={t("settings.profile.description", {
          date: formatDate(user.created_at),
        })}
        footer={
          <>
            <Button
              size='small'
              disabled={!dirty || update.isPending}
              onClick={() => setName(saved)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type='primary'
              htmlType='submit'
              size='small'
              disabled={!dirty}
              loading={update.isPending}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField label={t("settings.profile.displayName")}>
            {(id) => (
              <Input
                id={id}
                value={name}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={t("settings.profile.email")}
            hint={t("settings.profile.emailHint")}
          >
            {(id) => (
              <Input id={id} value={user.email ?? ""} disabled readOnly />
            )}
          </FormField>
        </div>
      </SettingsPanel>
    </form>
  );
}
