"use server";

import { revalidatePath } from "next/cache";
import { bustCache } from "@/lib/api";

export async function forceRefreshRoute(path: string) {
  // 1. Bust the in-memory article cache so lib/api.ts fetches fresh data
  bustCache();
  console.log("[revalidate] Busted in-memory cache");

  // 2. Revalidate the Next.js page cache so SSR re-runs
  revalidatePath(path, "page");
  revalidatePath("/", "page");
  console.log(`[revalidate] Revalidated path: ${path}`);
}
