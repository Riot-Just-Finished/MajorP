"use client";

import { useState } from "react";
import { forceRefreshRoute } from "@/actions/revalidate";
import { useRouter, usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  /** The category slug (e.g. "technology", "sports", "politics").
   *  Omit or pass "general" for the homepage / breaking-news feed. */
  category?: string;
}

export default function RefreshButton({ category = "general" }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function handleRefresh() {
    setLoading(true);
    try {
      // 1. Bust our in-memory Map cache for this category
      await fetch(`/api/news?force=true&category=${category}`);

      // 2. Invalidate Next.js SSR cache so the page re-fetches from lib/api.ts
      await forceRefreshRoute(pathname);

      // 3. Trigger a client-side re-render with fresh SSR data
      router.refresh();
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-full text-zinc-300 text-sm font-semibold transition-all duration-300 disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-500" : ""}`} />
      <span>{loading ? "Fetching..." : "Fetch New Articles"}</span>
    </button>
  );
}
