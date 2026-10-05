import { useMemo, useState } from "react";
import { PackageOpen, Search } from "lucide-react";
import { Input, Segmented } from "antd";
import { appRegistry } from "@/apps";
import { EmptyState, PageHeader } from "@/components/molecules";
import { AppStoreCard } from "@/components/organisms";
import { APP_CATEGORIES } from "@/constants";
import type { AppCategory } from "@/types";

type CategoryFilter = "all" | AppCategory;

export function AppStorePage() {
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
        title='App Store'
        description='Install utilities into your workspace. Everything you install shows up in the sidebar.'
      />

      {appRegistry.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title='No apps available yet'
          description={
            <>
              Apps live in{" "}
              <code className='font-mono text-xs'>src/apps/&lt;id&gt;/</code>.
              Add a folder with a{" "}
              <code className='font-mono text-xs'>manifest.ts</code> and it
              appears here.
            </>
          }
          className='mt-8 rounded-lg border border-dashed'
        />
      ) : (
        <>
          <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search apps'
              prefix={<Search className='size-3.5 text-muted-foreground' />}
              className='h-8 sm:w-72'
              aria-label='Search apps'
            />
            <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
              <Segmented<CategoryFilter>
                value={category}
                onChange={setCategory}
                options={[
                  { value: "all", label: "All" },
                  ...APP_CATEGORIES.map((c) => ({
                    value: c,
                    label: c,
                  })),
                ]}
              />
            </div>
          </div>

          <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {visible.map((app) => (
              <AppStoreCard key={app.id} app={app} />
            ))}
          </div>
          {visible.length === 0 && (
            <p className='py-16 text-center text-sm text-muted-foreground'>
              No apps match your search.
            </p>
          )}
        </>
      )}
    </div>
  );
}
