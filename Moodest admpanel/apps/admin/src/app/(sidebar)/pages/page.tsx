"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Page } from "@/types/page";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api-client";
import PageTable from "@/components/pages/page-table";
import { pageColumns } from "@/components/pages/page-columns";

export default function PagesListPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    setLoading(false);
    setPages([]);
  }, []);

  useEffect(() => {
    fetchPages();
    window.addEventListener("pages:updated", fetchPages);
    return () => window.removeEventListener("pages:updated", fetchPages);
  }, [fetchPages]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-semibold">⚠️ Custom CMS Pages Notice</p>
            <p className="text-xs text-amber-800 mt-1">
              Custom dynamic page creation is not supported by the current NestJS backend. Core legal policies (Privacy, Terms, Cookies) are managed under the Legal &amp; Compliance module.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
              <p className="text-muted-foreground">
                Manage static pages like About, Terms and Privacy
              </p>
            </div>
            <Button asChild>
              <Link href="/pages/add-page">
                <Plus className="h-4 w-4" />
                Add Page
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading pages...
            </div>
          ) : (
            <PageTable data={pages} columns={pageColumns} />
          )}
        </div>
      </div>
    </div>
  );
}
