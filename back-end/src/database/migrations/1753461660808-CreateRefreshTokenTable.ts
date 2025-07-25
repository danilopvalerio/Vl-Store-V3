import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokenTable1753461660808 implements MigrationInterface {
    name = 'CreateRefreshTokenTable1753461660808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hashedToken" character varying NOT NULL, "id_loja" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_80d7d99d57beb6b7b5ef18a2bbc" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_80d7d99d57beb6b7b5ef18a2bbc"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
    }

}
