-- CreateTable
CREATE TABLE "caixa" (
    "id_caixa" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "saldo_inicial" DECIMAL(10,2) DEFAULT 0,
    "saldo_final" DECIMAL(10,2),
    "data_abertura" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "data_fechamento" TIMESTAMP(6),
    "id_user_profile" UUID NOT NULL,

    CONSTRAINT "pk_caixa" PRIMARY KEY ("id_caixa")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id_cliente" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf_cnpj" VARCHAR(20),
    "email" VARCHAR(255),
    "telefone" VARCHAR(20),
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_cliente" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "configuracoes_loja" (
    "id_config" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "chave" VARCHAR(100) NOT NULL,
    "valor" VARCHAR(255),

    CONSTRAINT "pk_config_loja" PRIMARY KEY ("id_config")
);

-- CreateTable
CREATE TABLE "endereco_loja" (
    "id_endereco" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "logradouro" VARCHAR(255),
    "numero" VARCHAR(20),
    "bairro" VARCHAR(100),
    "cep" VARCHAR(20),
    "complemento" VARCHAR(255),
    "cidade" VARCHAR(100),
    "estado" VARCHAR(50),

    CONSTRAINT "pk_endereco_loja" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "item_venda" (
    "id_item_venda" UUID NOT NULL,
    "id_venda" UUID NOT NULL,
    "id_variacao" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "desconto_por_item" DECIMAL(10,2) DEFAULT 0,
    "acrescimo_por_item" DECIMAL(10,2) DEFAULT 0,
    "preco_final_unitario" DECIMAL(10,2) NOT NULL,
    "preco_subtotal" DECIMAL(10,2) NOT NULL,
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_item_venda" PRIMARY KEY ("id_item_venda")
);

-- CreateTable
CREATE TABLE "log_acesso" (
    "id_log_acesso" UUID NOT NULL,
    "id_user" UUID,
    "ip" VARCHAR(50),
    "user_agent" VARCHAR(255),
    "sucesso" BOOLEAN DEFAULT false,
    "data" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_log_acesso" PRIMARY KEY ("id_log_acesso")
);

-- CreateTable
CREATE TABLE "log_sistema" (
    "id_log_sistema" UUID NOT NULL,
    "id_user" UUID,
    "acao" VARCHAR(255) NOT NULL,
    "detalhes" TEXT,
    "data" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_log_sistema" PRIMARY KEY ("id_log_sistema")
);

-- CreateTable
CREATE TABLE "loja" (
    "id_loja" UUID NOT NULL,
    "admin_user_id" UUID,
    "nome" VARCHAR(255) NOT NULL,
    "cnpj_cpf" VARCHAR(20),
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_loja" PRIMARY KEY ("id_loja")
);

-- CreateTable
CREATE TABLE "movimentacao" (
    "id_movimentacao" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "id_caixa" UUID NOT NULL,
    "id_venda" UUID,
    "tipo" VARCHAR(20) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" VARCHAR(255),
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_movimentacao" PRIMARY KEY ("id_movimentacao")
);

-- CreateTable
CREATE TABLE "pagamento_venda" (
    "id_pagamento" UUID NOT NULL,
    "id_venda" UUID NOT NULL,
    "tipo_pagamento" VARCHAR(50) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "pk_pagamento" PRIMARY KEY ("id_pagamento")
);

-- CreateTable
CREATE TABLE "produto" (
    "id_produto" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "referencia" VARCHAR(100),
    "nome" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(100),
    "material" VARCHAR(100),
    "genero" VARCHAR(50),
    "ativo" BOOLEAN DEFAULT true,
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_produto" PRIMARY KEY ("id_produto")
);

-- CreateTable
CREATE TABLE "produto_variacao" (
    "id_variacao" UUID NOT NULL,
    "id_produto" UUID NOT NULL,
    "nome" VARCHAR(255),
    "descricao" TEXT,
    "quantidade" INTEGER DEFAULT 0,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_produto_variacao" PRIMARY KEY ("id_variacao")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id_refresh_token" UUID NOT NULL,
    "id_user" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiracao" TIMESTAMP(6) NOT NULL,
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN DEFAULT true,

    CONSTRAINT "pk_refresh_token" PRIMARY KEY ("id_refresh_token")
);

-- CreateTable
CREATE TABLE "telefone_loja" (
    "id_telefone_loja" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,

    CONSTRAINT "pk_telefone_loja" PRIMARY KEY ("id_telefone_loja")
);

-- CreateTable
CREATE TABLE "telefone_user" (
    "id_telefone" UUID NOT NULL,
    "id_user" UUID NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,

    CONSTRAINT "pk_telefone_user" PRIMARY KEY ("id_telefone")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_user" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "id_user_profile" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "cpf_cnpj" VARCHAR(20),
    "cargo" VARCHAR(100),
    "tipo_perfil" VARCHAR(50),
    "ativo" BOOLEAN DEFAULT true,
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_user_profile" PRIMARY KEY ("id_user_profile")
);

-- CreateTable
CREATE TABLE "venda" (
    "id_venda" UUID NOT NULL,
    "id_loja" UUID NOT NULL,
    "id_caixa" UUID,
    "id_user" UUID NOT NULL,
    "id_cliente" UUID,
    "data" DATE DEFAULT CURRENT_DATE,
    "hora" TIME(6) DEFAULT CURRENT_TIME,
    "desconto" DECIMAL(10,2) DEFAULT 0,
    "acrescimo" DECIMAL(10,2) DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'PENDENTE',
    "total_final" DECIMAL(10,2) NOT NULL,
    "valor_pago" DECIMAL(10,2) NOT NULL,
    "data_criacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ultima_atualizacao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_venda" PRIMARY KEY ("id_venda")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_cliente_cpf" ON "cliente"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "uk_config_chave_loja" ON "configuracoes_loja"("id_loja", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "uq_produto_referencia" ON "produto"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "uk_refresh_token" ON "refresh_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "uk_user_email" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uk_profile_loja_cpf" ON "user_profile"("id_loja", "cpf_cnpj");

-- AddForeignKey
ALTER TABLE "caixa" ADD CONSTRAINT "fk_caixa_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "caixa" ADD CONSTRAINT "fk_caixa_profile" FOREIGN KEY ("id_user_profile") REFERENCES "user_profile"("id_user_profile") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "configuracoes_loja" ADD CONSTRAINT "fk_config_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "endereco_loja" ADD CONSTRAINT "fk_end_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_venda" ADD CONSTRAINT "fk_item_variacao" FOREIGN KEY ("id_variacao") REFERENCES "produto_variacao"("id_variacao") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_venda" ADD CONSTRAINT "fk_item_venda" FOREIGN KEY ("id_venda") REFERENCES "venda"("id_venda") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "log_acesso" ADD CONSTRAINT "fk_log_acesso_user" FOREIGN KEY ("id_user") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "log_sistema" ADD CONSTRAINT "fk_log_user" FOREIGN KEY ("id_user") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "loja" ADD CONSTRAINT "fk_loja_admin" FOREIGN KEY ("admin_user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "fk_mov_caixa" FOREIGN KEY ("id_caixa") REFERENCES "caixa"("id_caixa") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "fk_mov_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "fk_mov_venda" FOREIGN KEY ("id_venda") REFERENCES "venda"("id_venda") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamento_venda" ADD CONSTRAINT "fk_pagamento_venda" FOREIGN KEY ("id_venda") REFERENCES "venda"("id_venda") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "fk_produto_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "produto_variacao" ADD CONSTRAINT "fk_variacao_produto" FOREIGN KEY ("id_produto") REFERENCES "produto"("id_produto") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "fk_refresh_user" FOREIGN KEY ("id_user") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "telefone_loja" ADD CONSTRAINT "fk_tel_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "telefone_user" ADD CONSTRAINT "fk_tel_user" FOREIGN KEY ("id_user") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "fk_profile_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "fk_profile_user" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venda" ADD CONSTRAINT "fk_venda_caixa" FOREIGN KEY ("id_caixa") REFERENCES "caixa"("id_caixa") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venda" ADD CONSTRAINT "fk_venda_cliente" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_cliente") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venda" ADD CONSTRAINT "fk_venda_loja" FOREIGN KEY ("id_loja") REFERENCES "loja"("id_loja") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venda" ADD CONSTRAINT "fk_venda_user" FOREIGN KEY ("id_user") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
