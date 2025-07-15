-- Este é o seu primeiro script de migração.
-- Ele deve ser executado uma única vez para configurar a estrutura inicial do banco de dados.
-- Ele cria todas as tabelas necessárias para a aplicação, define seus relacionamentos
-- e cria uma função de trigger para atualizar automaticamente os timestamps.

-- =================================================================
-- FUNÇÃO DE TRIGGER PARA ATUALIZAR TIMESTAMPS
-- Esta função será chamada por um trigger em cada tabela para atualizar
-- a coluna 'ultima_atualizacao' sempre que uma linha for modificada.
-- =================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- TABELA: loja
-- Armazena as informações da loja/empresa principal.
-- =================================================================
CREATE TABLE loja (
    id_loja UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf_cnpj_proprietario_loja VARCHAR(20) NOT NULL UNIQUE,
    data_nasc_proprietario DATE NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW()
);
-- Cria o trigger para a tabela 'loja'
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON loja
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: funcionario
-- Armazena os dados dos funcionários, vinculados a uma loja.
-- =================================================================
CREATE TABLE funcionario (
    cpf VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    id_loja UUID NOT NULL,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_loja) REFERENCES loja(id_loja) ON DELETE CASCADE
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON funcionario
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: produto
-- Catálogo de produtos base, sem variações.
-- =================================================================
CREATE TABLE produto (
    referencia VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    material VARCHAR(100),
    genero VARCHAR(50),
    id_loja UUID NOT NULL,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_loja) REFERENCES loja(id_loja) ON DELETE CASCADE
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON produto
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: produto_variacao
-- Variações de um produto (cor, tamanho, etc.).
-- =================================================================
CREATE TABLE produto_variacao (
    id_variacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto VARCHAR(100) NOT NULL,
    descricao_variacao TEXT,
    quant_variacao INT,
    valor DECIMAL(10, 2),
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_produto) REFERENCES produto(referencia) ON DELETE CASCADE
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON produto_variacao
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: caixa
-- Registros de abertura e fechamento de caixa.
-- =================================================================
CREATE TABLE caixa (
    id_caixa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_abertura DATE NOT NULL,
    hora_abertura TIME NOT NULL,
    hora_fechamento TIME,
    funcionario_responsavel VARCHAR(20),
    id_loja UUID NOT NULL,
    status VARCHAR(50) NOT NULL, -- Ex: 'ABERTO', 'FECHADO'
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (funcionario_responsavel) REFERENCES funcionario(cpf) ON DELETE SET NULL,
    FOREIGN KEY (id_loja) REFERENCES loja(id_loja) ON DELETE CASCADE
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON caixa
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: venda
-- Registra cada transação de venda.
-- =================================================================
CREATE TABLE venda (
    id_venda UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forma_pagamento VARCHAR(50) NOT NULL,
    funcionario_responsavel VARCHAR(20),
    data DATE NOT NULL,
    hora TIME NOT NULL,
    id_caixa UUID,
    id_loja UUID NOT NULL,
    desconto DECIMAL(10, 2),
    acrescimo DECIMAL(10, 2),
    status_venda VARCHAR(50) NOT NULL, -- Ex: 'CONCLUIDA', 'CANCELADA'
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (funcionario_responsavel) REFERENCES funcionario(cpf) ON DELETE SET NULL,
    FOREIGN KEY (id_caixa) REFERENCES caixa(id_caixa) ON DELETE SET NULL,
    FOREIGN KEY (id_loja) REFERENCES loja(id_loja) ON DELETE CASCADE
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON venda
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: item_venda
-- Tabela de junção para registrar os produtos de cada venda.
-- =================================================================
CREATE TABLE item_venda (
    id_item_venda UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_venda UUID NOT NULL,
    id_variacao UUID NOT NULL,
    quantidade_item INT,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_venda) REFERENCES venda(id_venda) ON DELETE CASCADE,
    FOREIGN KEY (id_variacao) REFERENCES produto_variacao(id_variacao) ON DELETE CASCADE
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON item_venda
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: movimentacao
-- Registra movimentações financeiras no caixa (sangrias, suprimentos).
-- =================================================================
CREATE TABLE movimentacao (
    id_movimentacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao TEXT,
    tipo VARCHAR(50), -- Ex: 'SANGRIA', 'SUPRIMENTO'
    valor DECIMAL(10, 2),
    id_caixa UUID NOT NULL,
    id_venda UUID, -- Opcional, se a movimentação for de uma venda
    id_loja UUID NOT NULL,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (id_caixa) REFERENCES caixa(id_caixa) ON DELETE CASCADE,
    FOREIGN KEY (id_venda) REFERENCES venda(id_venda) ON DELETE SET NULL,
    FOREIGN KEY (id_loja) REFERENCES loja(id_loja) ON DELETE CASCADE
);
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON movimentacao
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- =================================================================
-- TABELA: log_sistema
-- Registra ações importantes para fins de auditoria.
-- =================================================================
CREATE TABLE log_sistema (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf_funcionario VARCHAR(20),
    id_loja UUID NOT NULL,
    tipo_acao VARCHAR(50), -- EX: 'INSERCAO', 'REMOCAO', 'EDICAO'
    descricao TEXT NOT NULL,
    origem_ip VARCHAR(45),
    data_acao TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (cpf_funcionario) REFERENCES funcionario(cpf) ON DELETE SET NULL,
    FOREIGN KEY (id_loja) REFERENCES loja(id_loja) ON DELETE CASCADE
);
-- Note: A tabela de log geralmente não precisa de 'ultima_atualizacao',
-- pois seus registros são, por natureza, imutáveis.

