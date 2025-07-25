import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

// Interfaces de dados

interface Funcionario {
  nome: string;
}
interface ProductVariation {
  id_variacao: string;
  produto: { nome: string; referencia: string };
  descricao_variacao: string;
  preco_venda: number;
}

interface CartItem {
  id_variacao: string;
  nome: string;
  referencia: string;
  descricao_variacao: string;
  quantidade: number;
  precoUnitario: number;
}

interface Seller {
  id_funcionario: string;
  nome: string;
  cargo?: string;
  id_loja: string;
}

interface Cashier {
  id_caixa: string;
  nome: string;
  status: "ABERTO" | "FECHADO";
  funcionario_responsavel: Funcionario;
  data_abertura: string;
  hora_abertura: string;
}

interface SalePayload {
  id_funcionario: string;
  forma_pagamento: string;
  id_caixa: string; // Adicionado id_caixa
  itens: { id_variacao: string; quantidade: number; preco_unitario: number }[];
  desconto: number;
  acrescimo: number;
}

// Interface de Props
interface SalesFormProps {
  vendedoresDisponiveis: Seller[];
  produtosDisponiveis: ProductVariation[];
  jwtToken?: string;
  onSaleRegistered: (sale: any) => void;
}

const SalesForm: React.FC<SalesFormProps> = ({
  onSaleRegistered,
  jwtToken,
  vendedoresDisponiveis,
  produtosDisponiveis,
}) => {
  // Hooks de estado
  const [codigoVenda, setCodigoVenda] = useState<string>("");
  const [vendedorResponsavelId, setVendedorResponsavelId] =
    useState<string>("");
  const [dataVenda, setDataVenda] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string>("");
  const [quantidadeProduto, setQuantidadeProduto] = useState<number>(1);
  const [precoUnitario, setPrecoUnitario] = useState<string>("");
  const [carrinhoVenda, setCarrinhoVenda] = useState<CartItem[]>([]);
  const [descontoVenda, setDescontoVenda] = useState<string>("0.00");
  const [acrescimoVenda, setAcrescimoVenda] = useState<string>("0.00");

  // Novos estados para caixas e loading
  const [caixaSelecionadoId, setCaixaSelecionadoId] = useState<string>("");
  const [caixasDisponiveis, setCaixasDisponiveis] = useState<Cashier[]>([]);
  const [isLoadingCaixas, setIsLoadingCaixas] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estados para mensagens e pesquisas
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [produtoSearchTerm, setProdutoSearchTerm] = useState<string>("");
  const [showProductDropdown, setShowProductDropdown] =
    useState<boolean>(false);
  const [vendedorSearchTerm, setVendedorSearchTerm] = useState<string>("");
  const [showVendedorDropdown, setShowVendedorDropdown] =
    useState<boolean>(false);

  // Função para exibir mensagens de feedback
  const showMessage = (message: string, type: "success" | "error") => {
    if (type === "error") {
      setError(message);
      setTimeout(() => setError(""), 5000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 5000);
    }
  };

  // Efeito para gerar código da venda e data inicial
  useEffect(() => {
    const generateSaleCode = () =>
      `VENDA-${Math.floor(Math.random() * 90000) + 10000}`;
    setCodigoVenda(generateSaleCode());
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setDataVenda(localDateTime);
  }, []);

  // Efeito para buscar caixas quando um vendedor é selecionado
  useEffect(() => {
    const fetchCaixasDaLoja = async () => {
      // Nome da função alterado para clareza
      // Se nenhum vendedor estiver selecionado, limpa os caixas
      if (!vendedorResponsavelId || !jwtToken) {
        setCaixasDisponiveis([]);
        setCaixaSelecionadoId("");
        return;
      }

      setIsLoadingCaixas(true);
      setCaixaSelecionadoId(""); // 1. Encontrar o objeto completo do vendedor selecionado para obter o id_loja

      const vendedorSelecionado = vendedoresDisponiveis.find(
        (v) => v.id_funcionario === vendedorResponsavelId
      ); // Se não encontrar o vendedor ou o id_loja, interrompe a execução

      if (!vendedorSelecionado || !vendedorSelecionado.id_loja) {
        showMessage(
          "Dados do vendedor estão incompletos (sem loja associada).",
          "error"
        );
        setIsLoadingCaixas(false);
        return;
      }

      const id_loja = vendedorSelecionado.id_loja;

      try {
        const response = await axios.get(
          `https://vl-store-v2.onrender.com/api/caixas/loja/${id_loja}`,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        ); // --- MUDANÇA PRINCIPAL AQUI --- // Filtra apenas por caixas com status "ABERTO", independente do funcionário.

        const caixasAbertosNaLoja = response.data.data.filter(
          (caixa: any) => caixa.status === "ABERTO"
        );

        // LOG para verificar o resultado do novo filtro
        console.log("CAIXAS ABERTOS NA LOJA (FILTRADOS):", caixasAbertosNaLoja);

        setCaixasDisponiveis(caixasAbertosNaLoja); // Se houver apenas um caixa aberto, seleciona-o automaticamente

        if (caixasAbertosNaLoja.length === 1) {
          setCaixaSelecionadoId(caixasAbertosNaLoja[0].id_caixa);
        } else if (caixasAbertosNaLoja.length === 0) {
          // Mensagem de erro atualizada para refletir a nova lógica
          showMessage(
            "Não há nenhum caixa aberto nesta loja para registrar a venda.",
            "error"
          );
        }
      } catch (err: any) {
        showMessage(
          err.response?.data?.message || "Erro ao carregar caixas.",
          "error"
        );
        setCaixasDisponiveis([]);
      } finally {
        setIsLoadingCaixas(false);
      }
    };

    fetchCaixasDaLoja(); // O nome da função foi atualizado aqui também
  }, [vendedorResponsavelId, jwtToken, vendedoresDisponiveis]); // As dependências continuam as mesmas

  // ... resto do código do componente ...

  // Efeito para definir preço unitário ao selecionar um produto
  useEffect(() => {
    if (produtoSelecionadoId) {
      const produto = produtosDisponiveis.find(
        (p) => p.id_variacao === produtoSelecionadoId
      );
      if (produto) {
        setPrecoUnitario(produto.preco_venda.toFixed(2));
      }
    } else {
      setPrecoUnitario("");
    }
  }, [produtoSelecionadoId, produtosDisponiveis]);

  // Cálculo do valor total da venda
  const valorTotalVenda = useMemo(() => {
    const subtotalProdutos = carrinhoVenda.reduce(
      (sum, item) => sum + item.quantidade * item.precoUnitario,
      0
    );
    const descontoNum = parseFloat(descontoVenda.replace(",", ".")) || 0;
    const acrescimoNum = parseFloat(acrescimoVenda.replace(",", ".")) || 0;
    return subtotalProdutos - descontoNum + acrescimoNum;
  }, [carrinhoVenda, descontoVenda, acrescimoVenda]);

  // Filtros para pesquisa de produtos e vendedores
  const filteredProducts = useMemo(() => {
    if (!produtoSearchTerm.trim()) return [];
    const term = produtoSearchTerm.toLowerCase();
    return produtosDisponiveis.filter(
      (p) =>
        p.produto.nome.toLowerCase().includes(term) ||
        p.descricao_variacao.toLowerCase().includes(term) ||
        p.produto.referencia.toLowerCase().includes(term)
    );
  }, [produtoSearchTerm, produtosDisponiveis]);

  const filteredVendedores = useMemo(() => {
    if (!vendedorSearchTerm.trim()) return [];
    const term = vendedorSearchTerm.toLowerCase();
    return vendedoresDisponiveis.filter(
      (v) =>
        v.nome.toLowerCase().includes(term) ||
        (v.cargo && v.cargo.toLowerCase().includes(term))
    );
  }, [vendedorSearchTerm, vendedoresDisponiveis]);

  // Função para adicionar produto ao carrinho
  const handleAdicionarProdutoVenda = () => {
    if (!produtoSelecionadoId) {
      showMessage("Selecione um produto para adicionar.", "error");
      return;
    }
    const produto = produtosDisponiveis.find(
      (p) => p.id_variacao === produtoSelecionadoId
    );
    if (!produto) return;

    const itemExistente = carrinhoVenda.find(
      (item) => item.id_variacao === produtoSelecionadoId
    );
    if (itemExistente) {
      setCarrinhoVenda(
        carrinhoVenda.map((item) =>
          item.id_variacao === produtoSelecionadoId
            ? { ...item, quantidade: item.quantidade + quantidadeProduto }
            : item
        )
      );
    } else {
      const novoItem: CartItem = {
        id_variacao: produto.id_variacao,
        nome: produto.produto.nome,
        referencia: produto.produto.referencia,
        descricao_variacao: produto.descricao_variacao,
        quantidade: quantidadeProduto,
        precoUnitario: produto.preco_venda,
      };
      setCarrinhoVenda([...carrinhoVenda, novoItem]);
    }
    setProdutoSelecionadoId("");
    setQuantidadeProduto(1);
    setPrecoUnitario("");
    setProdutoSearchTerm("");
    setShowProductDropdown(false);
  };

  const handleRemoverProdutoDoCarrinho = (idVariacao: string) => {
    setCarrinhoVenda(
      carrinhoVenda.filter((item) => item.id_variacao !== idVariacao)
    );
  };

  const handleNumericInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    const sanitizedValue = value.replace(/[^0-9,.]/g, "").replace(",", ".");
    if (sanitizedValue.split(".").length > 2) return;
    setter(sanitizedValue);
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setCodigoVenda(`VENDA-${Math.floor(Math.random() * 90000) + 10000}`);
    setVendedorResponsavelId("");
    setVendedorSearchTerm("");
    setFormaPagamento("");
    setCaixaSelecionadoId("");
    setCaixasDisponiveis([]);
    setCarrinhoVenda([]);
    setDescontoVenda("0.00");
    setAcrescimoVenda("0.00");
    setProdutoSelecionadoId("");
    setQuantidadeProduto(1);
    setProdutoSearchTerm("");
  };

  // Função refatorada para submeter a venda
  const handleSubmitVenda = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !vendedorResponsavelId ||
      !formaPagamento ||
      !caixaSelecionadoId ||
      carrinhoVenda.length === 0
    ) {
      showMessage(
        "Preencha todos os campos obrigatórios: vendedor, forma de pagamento, caixa e adicione ao menos um produto.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    const salePayload: SalePayload = {
      id_funcionario: vendedorResponsavelId,
      forma_pagamento: formaPagamento,
      id_caixa: caixaSelecionadoId,
      itens: carrinhoVenda.map((item) => ({
        id_variacao: item.id_variacao,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
      })),
      desconto: parseFloat(descontoVenda.replace(",", ".")) || 0,
      acrescimo: parseFloat(acrescimoVenda.replace(",", ".")) || 0,
    };

    try {
      const config = { headers: { Authorization: `Bearer ${jwtToken}` } };

      // --- ETAPA 1: Registrar a Venda ---
      const responseVenda = await axios.post(
        "https://vl-store-v2.onrender.com/api/vendas",
        salePayload,
        config
      );

      console.log(responseVenda);

      // Extrai os dados da venda criada para usar na próxima etapa
      const vendaCriada = responseVenda.data.data;
      const idVendaCriada = responseVenda.data.data.id_venda;
      const valorTotalVenda = responseVenda.data.data.total; // Supondo que o backend retorna o valor total

      console.log(valorTotalVenda);
      // Validação da resposta da primeira chamada
      if (!idVendaCriada) {
        throw new Error(
          "A resposta do servidor para a criação da venda não contém os dados necessários (ID)."
        );
      }

      // --- ETAPA 2: Registrar a Movimentação no Caixa ---
      const movimentacaoPayload = {
        tipo: "ENTRADA",
        valor: valorTotalVenda,
        descricao: `Venda #${
          vendaCriada.codigo_venda || idVendaCriada.substring(0, 8)
        }`, // Descrição mais informativa
        id_venda: idVendaCriada,
      };

      await axios.post(
        `https://vl-store-v2.onrender.com/api/caixas/${caixaSelecionadoId}/movimentacoes`,
        movimentacaoPayload,
        config
      );

      // Se ambas as requisições deram certo, mostre o sucesso.
      showMessage(
        "Venda e movimentação de caixa registradas com sucesso!",
        "success"
      );
      onSaleRegistered(vendaCriada);
      resetForm();
    } catch (error: any) {
      console.error("Erro no processo de registro de venda:", error);

      // Mensagem de erro mais específica
      const backendMessage =
        error.response?.data?.message || "Ocorreu um erro desconhecido.";
      const errorMessage = error.message.includes("dados necessários")
        ? error.message
        : `Falha ao registrar venda ou movimentação. Erro: ${backendMessage}`;

      showMessage(errorMessage, "error");
      // Aqui você pode adicionar uma lógica para notificar o usuário que a venda pode ter sido criada, mas a movimentação falhou.
    } finally {
      setIsSubmitting(false);
    }
  };

  // JSX do componente
  return (
    <div className="quinary text-white p-4 rounded-5 white-light-small d-flex flex-column w-75 mx-auto h-100">
      {/* Alertas de erro e sucesso */}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="mb-3">
        <h5 className="mb-0 text-white">
          <i className="fas fa-plus-circle mr-2"></i>Registrar Nova Venda
        </h5>
      </div>

      <div
        className="flex-grow-1"
        style={{ overflowY: "auto", paddingRight: "10px" }}
      >
        <form id="sales-form-content" onSubmit={handleSubmitVenda} noValidate>
          {/* Linha 1: Vendedor e Data */}
          <div className="row mb-3">
            {/* Vendedor */}
            <div className="col-md-6 position-relative">
              <label
                htmlFor="vendedorResponsavel"
                className="form-label text-white-75 small"
              >
                Vendedor Responsável
              </label>
              <input
                type="text"
                className="form-control input-form"
                placeholder="Buscar vendedor..."
                value={vendedorSearchTerm}
                onChange={(e) => {
                  setVendedorSearchTerm(e.target.value);
                  setShowVendedorDropdown(true);
                }}
                onFocus={() => setShowVendedorDropdown(true)}
                onBlur={() =>
                  setTimeout(() => setShowVendedorDropdown(false), 200)
                }
              />
              {showVendedorDropdown && (
                <ul className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded">
                  {(vendedorSearchTerm && filteredVendedores.length > 0
                    ? filteredVendedores
                    : vendedoresDisponiveis
                  ).map((v) => (
                    <li
                      key={v.id_funcionario}
                      className="list-group-item bg-dark text-white cursor-pointer hover-light"
                      onClick={() => {
                        setVendedorResponsavelId(v.id_funcionario);
                        setVendedorSearchTerm(
                          `${v.nome}${v.cargo ? ` (${v.cargo})` : ""}`
                        );
                        setShowVendedorDropdown(false);
                      }}
                    >
                      {v.nome} {v.cargo && `(${v.cargo})`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Data e Hora */}
            <div className="col-md-6">
              <label
                htmlFor="dataVenda"
                className="form-label text-white-75 small"
              >
                Data e Hora
              </label>
              <input
                type="datetime-local"
                className="form-control input-form"
                id="dataVenda"
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Linha 2: Forma de Pagamento e Caixa */}
          <div className="row mb-4">
            {/* Forma de Pagamento */}
            <div className="col-md-6">
              <label
                htmlFor="formaPagamento"
                className="form-label text-white-75 small"
              >
                Forma de Pagamento
              </label>
              <select
                id="formaPagamento"
                className="form-control p-2 custom-select input-form"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                required
              >
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded"
                  value=""
                  disabled
                >
                  Selecione...
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded"
                  value="DINHEIRO"
                >
                  Dinheiro
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded"
                  value="CARTAO_CREDITO"
                >
                  Cartão de Crédito
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded"
                  value="CARTAO_DEBITO"
                >
                  Cartão de Débito
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded"
                  value="PIX"
                >
                  PIX
                </option>
              </select>
            </div>
            {/* Caixa */}
            <div className="col-md-6">
              <label htmlFor="caixa" className="form-label text-white-75 small">
                Caixa
              </label>
              <select
                id="caixa"
                className="form-control p-2  custom-select input-form"
                value={caixaSelecionadoId}
                onChange={(e) => setCaixaSelecionadoId(e.target.value)}
                disabled={caixasDisponiveis.length === 0}
                required
              >
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded"
                  value=""
                  disabled
                >
                  {isLoadingCaixas
                    ? "Carregando caixas..."
                    : vendedorResponsavelId
                    ? "Selecione um caixa aberto..."
                    : "Abra um caixa para adicionar uma venda"}
                </option>
                {caixasDisponiveis.map((caixa) => (
                  <option key={caixa.id_caixa} value={caixa.id_caixa}>
                    {"Caixa de: " +
                      caixa.funcionario_responsavel.nome +
                      ". Abertura: Data: " +
                      caixa.data_abertura +
                      " | Hora: " +
                      caixa.hora_abertura}
                  </option>
                ))}
              </select>
              {!isLoadingCaixas &&
                vendedorResponsavelId &&
                caixasDisponiveis.length === 0 && (
                  <div className="text-danger small mt-1">
                    Nenhum caixa aberto para este vendedor.
                  </div>
                )}
            </div>
          </div>

          {/* Seção de Produtos */}
          <h6 className="mb-3 text-white">
            <i className="fas fa-shopping-basket mr-2"></i>Produtos da Venda
          </h6>
          {/* ... restante do JSX para adicionar e listar produtos ... */}
          {/* Adicionar Produto */}
          <div className="row g-2 align-items-baseline mb-3">
            {/* Campo de busca de produto */}
            <div className="col-md-5 position-relative">
              <label
                htmlFor="produtoVenda"
                className="form-label text-white-75 small mb-1"
              >
                Produto
              </label>
              <input
                type="text"
                className="form-control input-form"
                placeholder="Buscar produto..."
                value={produtoSearchTerm}
                onChange={(e) => {
                  setProdutoSearchTerm(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() =>
                  setTimeout(() => setShowProductDropdown(false), 200)
                }
              />
              {showProductDropdown && filteredProducts.length > 0 && (
                <ul className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border rounded">
                  {filteredProducts.map((p) => (
                    <li
                      key={p.id_variacao}
                      className="list-group-item bg-dark text-white cursor-pointer hover-light"
                      onClick={() => {
                        setProdutoSelecionadoId(p.id_variacao);
                        setProdutoSearchTerm(
                          `${p.produto.nome} - ${p.descricao_variacao}`
                        );
                        setShowProductDropdown(false);
                      }}
                    >
                      {p.produto.nome} (REF: {p.produto.referencia}) -{" "}
                      {p.descricao_variacao}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Quantidade */}
            <div className="col-md-2">
              <label
                htmlFor="quantidadeProduto"
                className="form-label text-white-75 small mb-1"
              >
                Qtd.
              </label>
              <input
                type="number"
                className="form-control input-form"
                id="quantidadeProduto"
                value={quantidadeProduto}
                onChange={(e) =>
                  setQuantidadeProduto(parseInt(e.target.value, 10) || 1)
                }
                min="1"
              />
            </div>
            {/* Preço Unitário */}
            <div className="col-md-2">
              <label
                htmlFor="precoUnitario"
                className="form-label text-white-75 small mb-1"
              >
                Preço Un.
              </label>
              <input
                type="text"
                className="form-control input-form"
                id="precoUnitario"
                value={precoUnitario ? `R$ ${precoUnitario}` : ""}
                readOnly
              />
            </div>
            {/* Botão Adicionar */}
            <div className="col-md-3 d-flex align-items-end">
              <button
                type="button"
                className="btn primaria w-100"
                onClick={handleAdicionarProdutoVenda}
              >
                <i className="fas fa-plus"></i> Adicionar
              </button>
            </div>
          </div>
          {/* Tabela de Produtos do Carrinho */}
          <div
            className="mb-4 table-responsive quartenary p-2 rounded-lg"
            style={{ maxHeight: "200px", overflowY: "auto" }}
          >
            <table className="table table-sm table-borderless text-white">
              <thead>
                <tr className="fine-transparent-border">
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Preço Un.</th>
                  <th>Subtotal</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {carrinhoVenda.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-3 text-white-75">
                      Nenhum produto adicionado.
                    </td>
                  </tr>
                ) : (
                  carrinhoVenda.map((item) => (
                    <tr
                      key={item.id_variacao}
                      className="fine-transparent-border"
                    >
                      <td>
                        {item.nome} <small>({item.descricao_variacao})</small>
                      </td>
                      <td>{item.quantidade}</td>
                      <td>R$ {item.precoUnitario.toFixed(2)}</td>
                      <td>
                        R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-delete"
                          onClick={() =>
                            handleRemoverProdutoDoCarrinho(item.id_variacao)
                          }
                          title="Remover"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Desconto e Acréscimo */}
          <div className="row mb-4">
            <div className="col-md-6">
              <label
                htmlFor="descontoVenda"
                className="form-label text-white-75 small"
              >
                Desconto (R$)
              </label>
              <input
                type="text"
                className="form-control input-form"
                id="descontoVenda"
                placeholder="0.00"
                value={descontoVenda}
                onChange={(e) =>
                  handleNumericInputChange(setDescontoVenda, e.target.value)
                }
              />
            </div>
            <div className="col-md-6">
              <label
                htmlFor="acrescimoVenda"
                className="form-label text-white-75 small"
              >
                Acréscimo (R$)
              </label>
              <input
                type="text"
                className="form-control input-form"
                id="acrescimoVenda"
                placeholder="0.00"
                value={acrescimoVenda}
                onChange={(e) =>
                  handleNumericInputChange(setAcrescimoVenda, e.target.value)
                }
              />
            </div>
          </div>
        </form>
      </div>

      {/* Rodapé com Total e Botão Finalizar */}
      <div
        className="mt-auto pt-3 d-flex justify-content-between align-items-center border-top"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div>
          <h4 className="text-white mb-0">
            Total:{" "}
            <span className="font-weight-bold" style={{ color: "#86efac" }}>
              R$ {valorTotalVenda.toFixed(2)}
            </span>
          </h4>
        </div>
        <button
          type="submit"
          form="sales-form-content"
          className="btn primaria px-4 py-2"
          disabled={
            isSubmitting || !caixaSelecionadoId || carrinhoVenda.length === 0
          }
        >
          {isSubmitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span className="ms-2">Registrando...</span>
            </>
          ) : (
            <>
              <i className="fas fa-check-circle mr-2"></i>
              Finalizar Venda
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SalesForm;
