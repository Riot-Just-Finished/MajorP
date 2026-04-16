"use server";

import { revalidatePath } from "next/cache";

export async function forceRefreshRoute(path: string) {
  revalidatePath(path, 'page');
  revalidatePath('/', 'page');
}
