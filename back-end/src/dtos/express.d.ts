// src/@types/express.d.ts

// Esta linha mágica transforma o arquivo em um módulo,
// permitindo o uso de 'declare global', sem precisar importar variáveis não usadas.
export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        profileId: string; // Agora usamos profileId
        lojaId: string;
        role: string;
      };
    }
  }
}
