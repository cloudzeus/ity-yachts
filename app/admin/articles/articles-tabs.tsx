"use client"

import { useState } from "react"
import { FolderTree, Hash, Newspaper } from "lucide-react"
import { TaxonomyManager } from "@/components/admin/articles/taxonomy-manager"

type Tab = "articles" | "categories" | "tags"

const TABS: { id: Tab; label: string; icon: typeof Newspaper }[] = [
  { id: "articles", label: "Articles", icon: Newspaper },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "tags", label: "Tags", icon: Hash },
]

/**
 * Articles, and the taxonomy they are filed under, on one screen.
 *
 * Categories and tags are only ever edited while thinking about articles, so
 * they live behind a tab here rather than as two more entries in a sidebar
 * that is already long.
 */
export function ArticlesTabs({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("articles")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="-mb-px flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                borderBottom: `2px solid ${active ? "var(--primary)" : "transparent"}`,
                color: active ? "var(--primary)" : "var(--on-surface-variant)",
              }}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          )
        })}
      </div>

      {/* The article list is a server component, so it is passed in as children
          and simply hidden — remounting it on every tab switch would refetch
          the whole list for nothing. */}
      <div hidden={tab !== "articles"}>{children}</div>
      {tab === "categories" && <TaxonomyManager type="categories" />}
      {tab === "tags" && <TaxonomyManager type="tags" />}
    </div>
  )
}
