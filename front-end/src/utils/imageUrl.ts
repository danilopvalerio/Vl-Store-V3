// src/utils/imageUrl.ts
// Helper para garantir URLs absolutas de imagens do backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

/**
 * Converte um caminho de imagem em URL absoluta
 * @param caminho - Caminho relativo ou absoluto da imagem
 * @returns URL absoluta ou null se caminho inválido
 */
export const getImageUrl = (
  caminho: string | null | undefined,
): string | null => {
  if (!caminho) return null;

  // Já é URL absoluta
  if (caminho.startsWith("http://") || caminho.startsWith("https://")) {
    return caminho;
  }

  // Constrói URL absoluta
  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  let cleanPath = caminho.startsWith("/") ? caminho : `/${caminho}`;

  // Se o caminho começa com /perfis/ ou /produtos/ (sem /uploads/), adiciona /uploads
  if (
    cleanPath.match(/^\/(perfis|produtos)\//) &&
    !cleanPath.startsWith("/uploads/")
  ) {
    cleanPath = `/uploads${cleanPath}`;
  }

  return `${cleanBase}${cleanPath}`;
};
