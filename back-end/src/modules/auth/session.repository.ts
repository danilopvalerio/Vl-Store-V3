import { prisma } from "../../shared/database/prisma";
import dayjs from "dayjs";

export class SessionRepository {
  async saveRefreshToken(userId: string, token: string) {
    // Expira em 7 dias
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

  // Limpa tokens antigos do usuário para evitar lixo no banco
  async deleteUserTokens(userId: string) {
    return prisma.refresh_token.deleteMany({ where: { id_user: userId } });
  }

  async deleteRefreshToken(token: string) {
    // deleteMany é mais seguro que delete se o token não existir (evita erro P2025)
    return prisma.refresh_token.deleteMany({
      where: { token },
    });
  }
}
