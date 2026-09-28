// Edge-safe session token helpers (used by proxy.ts and server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "cs_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  sub: string;
  role: "CUSTOMER" | "ADMIN";
  tv: number;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
    }
    return new TextEncoder().encode("insecure-development-secret-please-set-AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, tv: payload.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: payload.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      tv: typeof payload.tv === "number" ? payload.tv : 0,
    };
  } catch {
    return null;
  }
}
