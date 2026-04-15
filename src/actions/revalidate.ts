"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function forceRefreshRoute(path: string) {
  revalidateTag('news');
  revalidatePath(path, 'page');
}
