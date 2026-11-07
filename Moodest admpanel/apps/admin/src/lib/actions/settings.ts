"use server";

import { revalidatePath } from "next/cache";
import { serverFetch } from "@/lib/api";

export async function updateAdminProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  const result = await serverFetch("/users/me", { method: "PATCH", body: data });
  revalidatePath("/settings");
  revalidatePath("/profile");
  return result;
}

export async function changeAdminPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return serverFetch("/auth/change-password", { method: "POST", body: data });
}
