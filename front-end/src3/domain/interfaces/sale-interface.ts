export interface Sale {
  id_venda: string;
  data_hora: string;
  funcionario: {
    nome: string;
    id_funcionario: string;
  };
  total: string;
  forma_pagamento: string;
  itens: Array<{
    nome: string;
    quantidade: number;
    preco_unitario: string;
    variacao: {
      descricao_variacao: string;
      referencia_produto: string;
      id_loja: string;
    };
  }>;
  desconto: number;
  acrescimo: number;
}
