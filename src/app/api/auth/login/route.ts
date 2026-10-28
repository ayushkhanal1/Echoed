import { NextResponse } from "next/server";
import { cognitoSignIn } from "@/lib/cognito";
import { verifyIdToken } from "@/lib/jwt";
import {
  syncCognitoUserToDb,
  SESSION_COOKIE_NAME,
  ACCESS_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const authResult = await cognitoSignIn(email, password);
    const authenticationResult = authResult.AuthenticationResult;

    if (!authenticationResult?.IdToken || !authenticationResult?.AccessToken) {
      return NextResponse.json(
        { error: "Authentication challenge returned instead of token" },
        { status: 400 }
      );
    }

    const idToken = authenticationResult.IdToken;
    const accessToken = authenticationResult.AccessToken;
    const expiresIn = authenticationResult.ExpiresIn || 3600;

    // Verify token and extract user details
    const payload = await verifyIdToken(idToken);

    // Sync into PostgreSQL users table
    const dbUser = await syncCognitoUserToDb(
      payload.sub,
      payload.email,
      payload["cognito:username"]
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        cognitoSub: dbUser.cognito_sub,
        email: dbUser.email,
        displayName: dbUser.display_name,
      },
      message: "Successfully logged in",
    });

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: expiresIn,
      path: "/",
    };

    response.cookies.set(SESSION_COOKIE_NAME, idToken, cookieOptions);
    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, cookieOptions);

    return response;
  } catch (error: any) {
    console.error("Login error:", error);

    let message = "Invalid email or password";
    if (error.name === "UserNotConfirmedException") {
      message = "User is not confirmed. Please verify your email first.";
    } else if (error.name === "UserNotFoundException") {
      message = "No account found with this email.";
    } else if (error.name === "NotAuthorizedException") {
      message = "Incorrect email or password.";
    } else if (error.message && error.message.includes("USER_PASSWORD_AUTH")) {
      message = "USER_PASSWORD_AUTH flow is not enabled in your Cognito App Client. Please enable it in the AWS Console.";
    } else if (error.message) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: 401 });
  }
}
