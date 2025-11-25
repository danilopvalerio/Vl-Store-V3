// src/utils/validation.ts

export function isValidEmail(email: string): boolean {
  if (!email) return false;

  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return regex.test(email.trim());
}

// UUID v4 (bem simples)
export function isValidUUID(id: string): boolean {
  if (!id) return false;
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(id);
}

// Checar strings pequenas (evita vazias ou absurdas)
export function isValidString(str: string, min = 1, max = 255): boolean {
  if (typeof str !== "string") return false;
  const s = str.trim();
  return s.length >= min && s.length <= max;
}

// Verifica se algo é número inteiro
export function isValidInt(value: any): boolean {
  const n = Number(value);
  return Number.isInteger(n) && !isNaN(n);
}

// Força converter um inteiro com fallback
export function toInt(value: any, fallback: number): number {
  return isValidInt(value) ? Number(value) : fallback;
}
