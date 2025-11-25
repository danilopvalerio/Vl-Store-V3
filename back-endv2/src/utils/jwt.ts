import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "sua_chave_secreta_super_segura";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "sua_chave_refresh_secreta";

interface TokenPayload {
  user_id: string;
  role: string;
  loja_id?: string; // Útil ter o ID da loja no token para facilitar queries
}

export function generateAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "1d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
