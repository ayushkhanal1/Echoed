import { NextResponse } from "next/server";
import { cognitoConfirmSignUp } from "@/lib/cognito";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    await cognitoConfirmSignUp(email, code.trim());

    return NextResponse.json({
      success: true,
      message: "Email successfully verified. You can now log in.",
    });
  } catch (error: any) {
    console.error("Confirmation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify code" },
      { status: 400 }
    );
  }
}
