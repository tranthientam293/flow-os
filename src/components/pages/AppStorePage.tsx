import { useMemo, useState } from "react";
import { PackageOpen, Search } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { appRegistry } from "@/apps";
import { Input, Tabs, TabsList, TabsTrigger } from "@/components/atoms";
import { EmptyState, PageHeader } from "@/components/molecules";
import { AppStoreCard } from "@/components/organisms";
import { APP_CATEGORIES } from "@/constants";
import type { AppCategory } from "@/types";

type CategoryFilter = "all" | AppCategory;

export function AppStorePage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appRegistry.filter(
      (app) =>
        (category === "all" || app.category === category) &&
        (!q ||
          `${app.name} ${app.tagline} ${app.description}`
            .toLowerCase()
            .includes(q)),
    );
  }, [query, category]);

  return (
    <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10'>
      <PageHeader
        title={t("store.title")}
        description={t("store.description")}
      />

      {appRegistry.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={t("store.emptyTitle")}
          description={
            <Trans
              i18nKey='store.emptyDescription'
              components={{
                folder: (
                  <code className='font-mono text-xs'>
                    src/apps/&lt;id&gt;/
                  </code>
                ),
                file: <code className='font-mono text-xs'>manifest.ts</code>,
              }}
            />
          }
          className='mt-8 rounded-lg border border-dashed'
        />
      ) : (
        <>
          <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative sm:w-72'>
              <Search className='pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("store.search")}
                className='h-8 pl-8'
                aria-label={t("store.search")}
              />
            </div>
            <Tabs
              value={category}
              onValueChange={(v) => setCategory(v as CategoryFilter)}
              className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'
            >
              <TabsList>
                <TabsTrigger value='all' className='pointer-coarse:h-8'>
                  {t("store.all")}
                </TabsTrigger>
                {APP_CATEGORIES.map((c) => (
                  <TabsTrigger key={c} value={c} className='pointer-coarse:h-8'>
                    {t(`store.categories.${c}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {visible.map((app) => (
              <AppStoreCard key={app.id} app={app} />
            ))}
          </div>
          {visible.length === 0 && (
            <p className='py-16 text-center text-sm text-muted-foreground'>
              {t("store.noMatch")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
