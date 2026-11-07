'use server';
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

async function getAuthenticatedAdmin() {
  const nextHeaders = await headers();
  const standardHeaders = new Headers();

  nextHeaders.forEach((value, key) => {
    standardHeaders.set(key, value);
  });

  const session = await auth.api.getSession({ headers: standardHeaders });

  if (!session?.user) throw new Error("Unauthorized");

  const admin = await prisma.user.findFirst({
    where: { id: session.user.id, role: 'admin' },
  });

  if (!admin) throw new Error("User not found or not an admin");

  return admin;
}

export const getAdminProfile = async () => {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) throw new Error("Unauthorized");

    const profile = await prisma.user.findFirst({
      where: { id: admin.id, role: "admin" },
      select: { id: true, role: true, name: true, email: true, phone: true, image: true },
    });

    if (!profile) throw new Error("User not found");

    return {
      success: true,
      profile: {
        id: profile.id ?? "",
        name: profile.name ?? "",
        email: profile.email ?? "",
        image: profile.image ?? "",
        phone: profile.phone ?? "",
        role: profile.role ?? "",
      },
      message: "Profile fetched successfully",
    };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch profile");
  }
};


export const resetPassword = async ({
  password,
  newPassword,
}: {
  password: string;
  newPassword: string;
}) => {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) throw new Error("Unauthorized");

    const { user } = await auth.api.changePassword({
      headers: await headers(),
      body: { newPassword, currentPassword: password },
    });

    return {
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      message: "Password updated successfully",
    };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to update password");
  }
};
