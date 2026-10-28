// Echoed — AWS Cognito Identity Provider Client & Utilities
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  GetUserCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";

function getCognitoConfig() {
  const region = process.env.COGNITO_REGION || "ap-southeast-2";
  const clientId = process.env.COGNITO_CLIENT_ID || "";
  const clientSecret = process.env.COGNITO_CLIENT_SECRET || "";
  return { region, clientId, clientSecret };
}

let _cognitoClient: CognitoIdentityProviderClient | null = null;
export function getCognitoClient(): CognitoIdentityProviderClient {
  if (!_cognitoClient) {
    const { region } = getCognitoConfig();
    _cognitoClient = new CognitoIdentityProviderClient({ region });
  }
  return _cognitoClient;
}

/**
 * Calculates the SECRET_HASH required by Cognito when an app client has a client secret.
 * Formula: Base64(HMAC_SHA256(clientSecret, username + clientId))
 */
export function calculateSecretHash(username: string): string {
  const { clientId, clientSecret } = getCognitoConfig();
  if (!clientSecret) {
    throw new Error("COGNITO_CLIENT_SECRET is not configured");
  }
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

/**
 * Signs up a new user in the Cognito User Pool.
 */
export async function cognitoSignUp(email: string, password: string) {
  const { clientId } = getCognitoConfig();
  const secretHash = calculateSecretHash(email);
  const command = new SignUpCommand({
    ClientId: clientId,
    SecretHash: secretHash,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  });

  return await getCognitoClient().send(command);
}

/**
 * Confirms a user's account with the verification code sent to their email.
 */
export async function cognitoConfirmSignUp(email: string, code: string) {
  const { clientId } = getCognitoConfig();
  const secretHash = calculateSecretHash(email);
  const command = new ConfirmSignUpCommand({
    ClientId: clientId,
    SecretHash: secretHash,
    Username: email,
    ConfirmationCode: code,
  });

  return await getCognitoClient().send(command);
}

/**
 * Resends the confirmation code to the user's email.
 */
export async function cognitoResendCode(email: string) {
  const { clientId } = getCognitoConfig();
  const secretHash = calculateSecretHash(email);
  const command = new ResendConfirmationCodeCommand({
    ClientId: clientId,
    SecretHash: secretHash,
    Username: email,
  });

  return await getCognitoClient().send(command);
}

/**
 * Signs in a user using USER_PASSWORD_AUTH flow.
 */
export async function cognitoSignIn(email: string, password: string) {
  const { clientId } = getCognitoConfig();
  const secretHash = calculateSecretHash(email);
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  });

  return await getCognitoClient().send(command);
}

/**
 * Retrieves the user's profile directly from Cognito using an access token.
 */
export async function cognitoGetUser(accessToken: string) {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  return await getCognitoClient().send(command);
}
