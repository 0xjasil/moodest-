import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );

    // Clear auth cookies
    res.cookies.delete("better-auth.session_token");
    res.cookies.delete("session_token");
    res.cookies.delete("auth.session-token");

    return res;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
