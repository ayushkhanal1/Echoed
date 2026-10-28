import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, ACCESS_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };

  response.cookies.set(SESSION_COOKIE_NAME, "", clearCookieOptions);
  response.cookies.set(ACCESS_COOKIE_NAME, "", clearCookieOptions);

  return response;
}
