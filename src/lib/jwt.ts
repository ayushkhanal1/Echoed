// Echoed — Cognito JWT Verification with JWKS
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

function getJwtConfig() {
  const region = process.env.COGNITO_REGION || "ap-southeast-2";
  const userPoolId = process.env.COGNITO_USER_POOL_ID || "";
  const clientId = process.env.COGNITO_CLIENT_ID || "";
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  return { region, userPoolId, clientId, issuer };
}

let _remoteJWKSet: ReturnType<typeof createRemoteJWKSet> | null = null;
function getRemoteJWKSet() {
  if (!_remoteJWKSet) {
    const { issuer } = getJwtConfig();
    const jwksUri = new URL(`${issuer}/.well-known/jwks.json`);
    _remoteJWKSet = createRemoteJWKSet(jwksUri);
  }
  return _remoteJWKSet;
}

export interface CognitoIdTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  "cognito:username"?: string;
}

/**
 * Verifies an ID token issued by our Cognito User Pool.
 */
export async function verifyIdToken(token: string): Promise<CognitoIdTokenPayload> {
  const { issuer, clientId } = getJwtConfig();
  const { payload } = await jwtVerify(token, getRemoteJWKSet(), {
    issuer,
    audience: clientId,
  });

  return payload as CognitoIdTokenPayload;
}

/**
 * Verifies an Access token issued by our Cognito User Pool.
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { issuer, clientId } = getJwtConfig();
  const { payload } = await jwtVerify(token, getRemoteJWKSet(), {
    issuer,
  });

  if (payload.client_id !== clientId) {
    throw new Error("Token client_id mismatch");
  }

  return payload;
}
