import jwt from "jsonwebtoken";

// O que vai dentro do token criptografado
export interface TokenPayload {
  userId: string;
  profileId: string;
  lojaId: string;
  role: string;
}

// Fallbacks seguros se não houver .env
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_123";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_123";

const ACCESS_EXPIRES = "15m"; // Padrão
const REFRESH_EXPIRES = "7d"; // Padrão

// CORREÇÃO: Adicionado 'expiresIn' opcional
export function generateAccessToken(
  payload: TokenPayload,
  expiresIn?: string | number
): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    // Usa o valor passado ou o padrão
    expiresIn: expiresIn || ACCESS_EXPIRES,
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
