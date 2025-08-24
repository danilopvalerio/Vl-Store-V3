import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailAndPasswordToFuncionario1755985020430 implements MigrationInterface {
    name = 'AddEmailAndPasswordToFuncionario1755985020430'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funcionario" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "funcionario" ADD CONSTRAINT "UQ_f868493b618f6780e84ea266e5e" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "funcionario" ADD "senha" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funcionario" DROP COLUMN "senha"`);
        await queryRunner.query(`ALTER TABLE "funcionario" DROP CONSTRAINT "UQ_f868493b618f6780e84ea266e5e"`);
        await queryRunner.query(`ALTER TABLE "funcionario" DROP COLUMN "email"`);
    }

}
