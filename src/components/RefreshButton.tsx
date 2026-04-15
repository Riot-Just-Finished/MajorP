"use client";

import { useState } from "react";
import { forceRefreshRoute } from "@/actions/revalidate";
import { useRouter, usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function handleRefresh() {
    setLoading(true);
    try {
      await forceRefreshRoute(pathname);
      router.refresh();
    } finally {
      setTimeout(() => setLoading(false), 500); // provide a short visual cue
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
