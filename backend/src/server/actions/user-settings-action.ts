'use server';

import {prisma} from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

async function getAuthenticatedUser() {
  const nextHeaders = await headers();
  const standardHeaders = new Headers();

  nextHeaders.forEach((value, key) => {
    standardHeaders.set(key, value);
  });

  const session = await auth.api.getSession({ headers: standardHeaders });

  if (!session?.user) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) throw new Error("User not found");

  return user;
}

export const getUserProfile = async () => {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
      },
    });

    if (!profile) throw new Error("User not found");

    return {
      success: true,
      profile: {
        id: profile.id || "",
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        image: profile.image || "",
        role: profile.role || "",
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
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const { user: updatedUser } = await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword: password, newPassword },
    });

    return {
      success: true,
      profile: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
      message: "Password updated successfully",
    };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to update password");
  }
};
