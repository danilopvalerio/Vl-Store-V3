// src/utils/jwt.ts
import jwt from "jsonwebtoken";

// O que vai dentro do token criptografado
export interface TokenPayload {
  userId: string;
  profileId: string;
  lojaId: string;
  role: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_123";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_123";

const ACCESS_EXPIRES = "15m"; // Access token curto
const REFRESH_EXPIRES = "7d"; // Refresh token longo

export function generateAccessToken(payload: TokenPayload): string {
  // Casting para any/SignOptions para evitar erro de overload do TS
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, REFRESH_SECRET);
}
