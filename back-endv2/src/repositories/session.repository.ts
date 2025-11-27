// src/repositories/session.repository.ts
import { prisma } from "../database/prisma";
import dayjs from "dayjs"; // Instale: npm i dayjs

export class SessionRepository {
  async saveRefreshToken(userId: string, token: string) {
    // Expira em 7 dias no banco também
    const expiracao = dayjs().add(7, "day").toDate();

    return prisma.refresh_token.create({
      data: {
        id_user: userId,
        token,
        expiracao,
        ativo: true,
      },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refresh_token.findUnique({
      where: { token },
    });
  }

  // Opcional: Limpar tokens antigos do user ao logar
  async deleteUserTokens(userId: string) {
    return prisma.refresh_token.deleteMany({ where: { id_user: userId } });
  }

  async deleteRefreshToken(token: string) {
    // Usamos deleteMany por segurança: se o token não existir, não dá erro crítico,
    // apenas retorna count: 0, o que para nós é "sucesso" (já não existe).
    return prisma.refresh_token.deleteMany({
      where: { token },
    });
  }
}
