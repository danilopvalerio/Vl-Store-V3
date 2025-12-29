import { prisma } from "../../shared/database/prisma";
import { refresh_token } from "../../shared/database/generated/prisma/client";
import dayjs from "dayjs";

export class SessionRepository {
  async saveRefreshToken(
    userId: string,
    token: string
  ): Promise<refresh_token> {
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

  async findRefreshToken(token: string): Promise<refresh_token | null> {
    return prisma.refresh_token.findUnique({
      where: { token },
    });
  }

  async deleteUserTokens(userId: string): Promise<void> {
    await prisma.refresh_token.deleteMany({
      where: { id_user: userId },
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refresh_token.deleteMany({
      where: { token },
    });
  }
}
