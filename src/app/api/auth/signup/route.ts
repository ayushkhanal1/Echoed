import { NextResponse } from "next/server";
import { cognitoSignUp } from "@/lib/cognito";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const response = await cognitoSignUp(email, password);

    return NextResponse.json({
      success: true,
      userSub: response.UserSub,
      userConfirmed: response.UserConfirmed ?? false,
      message: "Registration successful. Please verify the code sent to your email.",
    });
  } catch (error: any) {
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 400 }
    );
  }
}
