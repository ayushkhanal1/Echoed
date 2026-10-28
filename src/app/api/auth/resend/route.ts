import { NextResponse } from "next/server";
import { cognitoResendCode } from "@/lib/cognito";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await cognitoResendCode(email);

    return NextResponse.json({
      success: true,
      message: "Verification code resent.",
    });
  } catch (error: any) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend code" },
      { status: 400 }
    );
  }
}
