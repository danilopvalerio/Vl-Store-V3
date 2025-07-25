import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1752691606846 implements MigrationInterface {
    name = 'CreateInitialSchema1752691606846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "venda" ("id_venda" uuid NOT NULL DEFAULT uuid_generate_v4(), "forma_pagamento" character varying(50) NOT NULL, "funcionario_responsavel" character varying(20), "data" date NOT NULL, "hora" TIME NOT NULL, "id_caixa" uuid, "id_loja" uuid NOT NULL, "desconto" numeric(10,2), "acrescimo" numeric(10,2), "status_venda" character varying(50) NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b5cb96cfbe10a76e19661e2175" PRIMARY KEY ("id_venda"))`);
        await queryRunner.query(`CREATE TABLE "item_venda" ("id_item_venda" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_venda" uuid NOT NULL, "id_variacao" uuid NOT NULL, "quantidade_item" integer, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_133a94e491d03b03246fdae0491" PRIMARY KEY ("id_item_venda"))`);
        await queryRunner.query(`CREATE TABLE "produto_variacao" ("id_variacao" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_produto" character varying(100) NOT NULL, "descricao_variacao" text, "quant_variacao" integer, "valor" numeric(10,2), "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3d86b777466a22892b4d869e7f6" PRIMARY KEY ("id_variacao"))`);
        await queryRunner.query(`CREATE TABLE "produto" ("referencia" character varying(100) NOT NULL, "nome" character varying(255) NOT NULL, "categoria" character varying(100) NOT NULL, "material" character varying(100), "genero" character varying(50), "id_loja" uuid NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba779217515959554bc7b8cf446" PRIMARY KEY ("referencia"))`);
        await queryRunner.query(`CREATE TABLE "log_sistema" ("id_log" uuid NOT NULL DEFAULT uuid_generate_v4(), "cpf_funcionario" character varying(20), "id_loja" uuid NOT NULL, "tipo_acao" character varying(50), "descricao" text NOT NULL, "origem_ip" character varying(45), "data_acao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_35e6fb49e3047860f46d27fb104" PRIMARY KEY ("id_log"))`);
        await queryRunner.query(`CREATE TABLE "loja" ("id_loja" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(255) NOT NULL, "senha" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "cpf_cnpj_proprietario_loja" character varying(20) NOT NULL, "data_nasc_proprietario" date NOT NULL, "telefone" character varying(20) NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8eb9cf24e5e5607c32709fb088f" UNIQUE ("email"), CONSTRAINT "UQ_3fa09b32bd731c29983880dbd81" UNIQUE ("cpf_cnpj_proprietario_loja"), CONSTRAINT "UQ_112a3e7797dd8bb6e976642293a" UNIQUE ("telefone"), CONSTRAINT "PK_b6ae9000b81462cc864e730f5cb" PRIMARY KEY ("id_loja"))`);
        await queryRunner.query(`CREATE TABLE "funcionario" ("cpf" character varying(20) NOT NULL, "nome" character varying(255) NOT NULL, "cargo" character varying(100), "data_nascimento" date NOT NULL, "telefone" character varying(20), "id_loja" uuid NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a84346b7f338dec9a7eeae49935" PRIMARY KEY ("cpf"))`);
        await queryRunner.query(`CREATE TABLE "caixa" ("id_caixa" uuid NOT NULL DEFAULT uuid_generate_v4(), "data_abertura" date NOT NULL, "hora_abertura" TIME NOT NULL, "hora_fechamento" TIME, "funcionario_responsavel" character varying(20), "id_loja" uuid NOT NULL, "status" character varying(50) NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23de27bbaaa89eb4c71f6baa003" PRIMARY KEY ("id_caixa"))`);
        await queryRunner.query(`CREATE TABLE "movimentacao" ("id_movimentacao" uuid NOT NULL DEFAULT uuid_generate_v4(), "descricao" text, "tipo" character varying(50), "valor" numeric(10,2), "id_caixa" uuid NOT NULL, "id_venda" uuid, "id_loja" uuid NOT NULL, "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), "ultima_atualizacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2c4105a836c33f4fff9988ce9ab" PRIMARY KEY ("id_movimentacao"))`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_09cb377ea42e85d95a59508e497" FOREIGN KEY ("funcionario_responsavel") REFERENCES "funcionario"("cpf") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_d077022d2aa64dfed944cdae318" FOREIGN KEY ("id_caixa") REFERENCES "caixa"("id_caixa") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_0592148b64d2e329da9f4151cd2" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_venda" ADD CONSTRAINT "FK_9d8953454725b953cb6f9886639" FOREIGN KEY ("id_venda") REFERENCES "venda"("id_venda") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item_venda" ADD CONSTRAINT "FK_858117067bfdc528ea508386419" FOREIGN KEY ("id_variacao") REFERENCES "produto_variacao"("id_variacao") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "produto_variacao" ADD CONSTRAINT "FK_ed5bac6ee0b5ac1d0adaaea74d3" FOREIGN KEY ("id_produto") REFERENCES "produto"("referencia") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "produto" ADD CONSTRAINT "FK_869d54e0cdc66706d7fdd39d259" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "log_sistema" ADD CONSTRAINT "FK_6b55e7d4347ca58fee9ce8c2d0d" FOREIGN KEY ("cpf_funcionario") REFERENCES "funcionario"("cpf") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "log_sistema" ADD CONSTRAINT "FK_eecb4e9d9cb48b3fc516f46d609" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funcionario" ADD CONSTRAINT "FK_2304daaecee96a6093c293e71ab" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "caixa" ADD CONSTRAINT "FK_e2c4ee02c8cb875f8db4b18362d" FOREIGN KEY ("funcionario_responsavel") REFERENCES "funcionario"("cpf") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "caixa" ADD CONSTRAINT "FK_47e6f5404e1b9d3ba2c00f41b84" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimentacao" ADD CONSTRAINT "FK_68fdd140dd3389644b9e4f9f864" FOREIGN KEY ("id_caixa") REFERENCES "caixa"("id_caixa") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimentacao" ADD CONSTRAINT "FK_f92bde869340868921affa0bfd3" FOREIGN KEY ("id_venda") REFERENCES "venda"("id_venda") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimentacao" ADD CONSTRAINT "FK_f9cc1a886195140a41d9abbc414" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movimentacao" DROP CONSTRAINT "FK_f9cc1a886195140a41d9abbc414"`);
        await queryRunner.query(`ALTER TABLE "movimentacao" DROP CONSTRAINT "FK_f92bde869340868921affa0bfd3"`);
        await queryRunner.query(`ALTER TABLE "movimentacao" DROP CONSTRAINT "FK_68fdd140dd3389644b9e4f9f864"`);
        await queryRunner.query(`ALTER TABLE "caixa" DROP CONSTRAINT "FK_47e6f5404e1b9d3ba2c00f41b84"`);
        await queryRunner.query(`ALTER TABLE "caixa" DROP CONSTRAINT "FK_e2c4ee02c8cb875f8db4b18362d"`);
        await queryRunner.query(`ALTER TABLE "funcionario" DROP CONSTRAINT "FK_2304daaecee96a6093c293e71ab"`);
        await queryRunner.query(`ALTER TABLE "log_sistema" DROP CONSTRAINT "FK_eecb4e9d9cb48b3fc516f46d609"`);
        await queryRunner.query(`ALTER TABLE "log_sistema" DROP CONSTRAINT "FK_6b55e7d4347ca58fee9ce8c2d0d"`);
        await queryRunner.query(`ALTER TABLE "produto" DROP CONSTRAINT "FK_869d54e0cdc66706d7fdd39d259"`);
        await queryRunner.query(`ALTER TABLE "produto_variacao" DROP CONSTRAINT "FK_ed5bac6ee0b5ac1d0adaaea74d3"`);
        await queryRunner.query(`ALTER TABLE "item_venda" DROP CONSTRAINT "FK_858117067bfdc528ea508386419"`);
        await queryRunner.query(`ALTER TABLE "item_venda" DROP CONSTRAINT "FK_9d8953454725b953cb6f9886639"`);
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_0592148b64d2e329da9f4151cd2"`);
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_d077022d2aa64dfed944cdae318"`);
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_09cb377ea42e85d95a59508e497"`);
        await queryRunner.query(`DROP TABLE "movimentacao"`);
        await queryRunner.query(`DROP TABLE "caixa"`);
        await queryRunner.query(`DROP TABLE "funcionario"`);
        await queryRunner.query(`DROP TABLE "loja"`);
        await queryRunner.query(`DROP TABLE "log_sistema"`);
        await queryRunner.query(`DROP TABLE "produto"`);
        await queryRunner.query(`DROP TABLE "produto_variacao"`);
        await queryRunner.query(`DROP TABLE "item_venda"`);
        await queryRunner.query(`DROP TABLE "venda"`);
    }

}
