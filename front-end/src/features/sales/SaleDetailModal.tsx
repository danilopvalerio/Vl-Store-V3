"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faBan,
  faTrash,
  faPlus,
  faCheck,
  faHourglassHalf,
  faPrint,
  faShoppingBag,
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";
import api from "../../utils/api";
import { CartItem, CashierOption, Sale } from "./types";
import { PaginatedResponse, ApiErrorResponse } from "@/types/api";
import SaleItemsTable from "./SaleItemsTable";

interface Props {
  saleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface NewPaymentEntry {
  id: string;
  tipo_pagamento: string;
  valor: number;
}

const SaleDetailModal = ({ saleId, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);

  const [cashiers, setCashiers] = useState<CashierOption[]>([]);
  const [selectedCashierId, setSelectedCashierId] = useState<string>("");
  const [newPayments, setNewPayments] = useState<NewPaymentEntry[]>([]);
  const [currentMethod, setCurrentMethod] = useState("DINHEIRO");
  const [currentAmount, setCurrentAmount] = useState<number>(0);

  // 1️⃣ REF para o conteúdo a ser impresso
  const printRef = useRef<HTMLDivElement>(null);

  // 2️⃣ Hook de impressão com estilos para expandir o conteúdo
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Venda_${saleId?.substring(0, 8) || "Detalhe"}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        /* Esconde elementos marcados com no-print */
        .no-print {
          display: none !important;
        }
        /* Remove sombras e bordas do modal para o papel */
        .modal-content {
          box-shadow: none !important;
          border: none !important;
        }
        /* Força a exibição de todo o conteúdo, removendo scrolls */
        .overflow-auto, .overflow-hidden, .overflow-y-auto {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
        }
        /* Ajuste de layout para impressão (empilhar colunas se necessário ou manter lado a lado) */
        .col-md-4, .col-md-8 {
          flex: 0 0 auto !important;
          width: 100% !important; /* Em A4, geralmente fica melhor um abaixo do outro */
          max-width: 100% !important;
        }
        /* Esconde o backdrop do modal se ele for capturado */
        .modal-backdrop {
          background: none !important;
        }
      }
    `,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const resSale = await api.get<Sale>(`/vendas/${saleId}`);
        setSale(resSale.data);

        if (resSale.data.status === "PENDENTE") {
          const resCaixas = await api.get<PaginatedResponse<CashierOption>>(
            "/caixas?perPage=50"
          );
          const activeCashiers = resCaixas.data.data.filter(
            (c) => c.status === "ABERTO" || c.status === "REABERTO"
          );
          setCashiers(activeCashiers);
        }
      } catch (err) {
        console.error("Erro ao carregar venda:", err);
        alert("Erro ao carregar detalhes da venda.");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (saleId) {
      fetchDetails();
    }
  }, [saleId, onClose]);

  // Cálculos
  const totalVenda = sale ? sale.total_final : 0;
  const valorJaPago = sale ? sale.valor_pago : 0;
  const descontoGlobal = sale ? sale.desconto : 0;
  const acrescimoGlobal = sale ? sale.acrescimo : 0;

  const valorNovosPagamentos = newPayments.reduce((acc, p) => acc + p.valor, 0);
  const totalAcumulado = valorJaPago + valorNovosPagamentos;
  const faltaPagar = Math.max(0, totalVenda - totalAcumulado);
  const troco = totalAcumulado > totalVenda ? totalAcumulado - totalVenda : 0;

  useEffect(() => {
    if (faltaPagar > 0) {
      setCurrentAmount(Number(faltaPagar.toFixed(2)));
    } else {
      setCurrentAmount(0);
    }
  }, [faltaPagar]);

  const handleAddPayment = () => {
    if (currentAmount <= 0) return;
    const newPayment: NewPaymentEntry = {
      id: Math.random().toString(36).substring(7),
      tipo_pagamento: currentMethod,
      valor: currentAmount,
    };
    setNewPayments([...newPayments, newPayment]);
  };

  const handleRemovePayment = (id: string) => {
    setNewPayments(newPayments.filter((p) => p.id !== id));
  };

  const handleSavePayments = async () => {
    if (newPayments.length === 0) return;
    setProcessing(true);
    try {
      // Recupera ID do usuário do localStorage de forma segura
      const userStr = localStorage.getItem("user");
      const userId = userStr ? JSON.parse(userStr).userId : "";

      await api.post(`/vendas/${saleId}/payment`, {
        pagamentos: newPayments.map((p) => ({
          tipo_pagamento: p.tipo_pagamento,
          valor: p.valor,
        })),
        actorUserId: userId,
      });
      alert("Pagamento registrado com sucesso!");
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(
        axiosError.response?.data?.message || "Erro ao registrar pagamento."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSale = async () => {
    if (
      !confirm(
        "Tem certeza que deseja CANCELAR esta venda? Isso estornará o estoque."
      )
    )
      return;

    setProcessing(true);
    try {
      await api.patch(`/vendas/${saleId}/status`, {
        status: "CANCELADA",
      });
      alert("Venda cancelada com sucesso.");
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.message || "Erro ao cancelar venda.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !sale) {
    return (
      <div
        className="modal-backdrop d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1050,
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <div className="spinner-border text-white" />
      </div>
    );
  }

  const tableItems: CartItem[] = (sale.itens || []).map((i) => ({
    tempId: i.id_item_venda,
    id_variacao: "N/A",
    nome_produto: i.nome_produto,
    nome_variacao: i.nome_variacao,
    quantidade: i.quantidade,
    preco_unitario: i.preco_unitario,
    subtotal: i.preco_subtotal,
    desconto_por_item: i.desconto_por_item,
    acrescimo_por_item: i.acrescimo_por_item,
  }));

  const isPendente = sale.status === "PENDENTE";
  const isCancelada = sale.status === "CANCELADA";

  let headerClass = "bg-success";
  if (isPendente) headerClass = "bg-warning text-dark";
  if (isCancelada) headerClass = "bg-danger";

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1050,
      }}
    >
      <div
        className="modal-dialog"
        style={{
          width: "95%",
          maxWidth: "1100px",
          height: "90vh",
          margin: "auto",
        }}
      >
        {/* 3️⃣ Aplicamos a REF aqui no modal-content para capturar tudo */}
        <div
          ref={printRef}
          className="modal-content border-0 shadow-lg d-flex flex-column"
          style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
        >
          {/* HEADER */}
          <div
            className={`modal-header border-0 p-3 flex-shrink-0 ${headerClass}`}
          >
            <h5
              className={`modal-title fw-bold ${
                isPendente ? "text-dark" : "text-white"
              }`}
            >
              <FontAwesomeIcon icon={faReceipt} className="me-2" />
              Detalhes da Venda #{sale.id_venda.substring(0, 8)}
              <span className="ms-3 badge bg-white text-dark opacity-75 small">
                {sale.status}
              </span>
            </h5>
            {/* Botão Fechar: Adicionado classe 'no-print' */}
            <button
              type="button"
              className={`btn-close no-print ${
                !isPendente ? "btn-close-white" : ""
              }`}
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body bg-white p-0 d-flex flex-column flex-md-row overflow-hidden flex-grow-1">
            {/* COLUNA ESQUERDA */}
            <div className="col-12 col-md-4 bg-light p-3 border-end d-flex flex-column overflow-y-auto h-100">
              {/* Card Info Básica */}
              <div className="card border-0 shadow-sm mb-3 flex-shrink-0">
                <div className="card-body p-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Data:</span>
                    <span className="fw-bold">
                      {new Date(sale.data_criacao).toLocaleString()}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Tipo:</span>
                    <span className="fw-bold d-flex align-items-center">
                      <FontAwesomeIcon
                        icon={faShoppingBag}
                        className="me-1 text-secondary"
                        size="xs"
                      />
                      {sale.tipo_venda}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Cliente:</span>
                    <span className="fw-bold">
                      {sale.nome_cliente || "Não informado"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Vendedor:</span>
                    <span className="fw-bold">
                      {sale.nome_vendedor || "Direta"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SE PENDENTE: Formulário de Pagamento (Classe 'no-print' para sumir na impressão) */}
              {isPendente && (
                <div className="card border-warning shadow-sm mb-3 flex-shrink-0 no-print">
                  <div className="card-header bg-warning-subtle text-warning-emphasis fw-bold small">
                    <FontAwesomeIcon icon={faHourglassHalf} className="me-2" />
                    Adicionar Pagamento
                  </div>
                  <div className="card-body p-3">
                    {cashiers.length > 0 && (
                      <div className="mb-3">
                        <label className="small text-muted fw-bold mb-1">
                          Caixa (Opcional)
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={selectedCashierId}
                          onChange={(e) => setSelectedCashierId(e.target.value)}
                        >
                          <option value="">-- Não vincular a caixa --</option>
                          {cashiers.map((c) => (
                            <option key={c.id_caixa} value={c.id_caixa}>
                              CX #{c.id_caixa.substring(0, 3)} -{" "}
                              {c.nome_responsavel}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="bg-white p-2 rounded border mb-2">
                      <div className="input-group input-group-sm mb-2">
                        <select
                          className="form-select fw-bold text-dark"
                          value={currentMethod}
                          onChange={(e) => setCurrentMethod(e.target.value)}
                        >
                          <option value="DINHEIRO">DINHEIRO</option>
                          <option value="PIX">PIX</option>
                          <option value="CARTAO_CREDITO">CRÉDITO</option>
                          <option value="CARTAO_DEBITO">DÉBITO</option>
                          <option value="CREDIARIO">CREDIÁRIO</option>
                        </select>
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">R$</span>
                        <input
                          type="number"
                          className="form-control fw-bold"
                          value={currentAmount}
                          onChange={(e) =>
                            setCurrentAmount(Number(e.target.value))
                          }
                        />
                        <button
                          className="btn btn-success"
                          onClick={handleAddPayment}
                          disabled={currentAmount <= 0}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>
                    </div>

                    {newPayments.length > 0 && (
                      <ul className="list-group list-group-flush border rounded mb-2">
                        {newPayments.map((p) => (
                          <li
                            key={p.id}
                            className="list-group-item d-flex justify-content-between p-2 small"
                          >
                            <span>{p.tipo_pagamento}</span>
                            <span className="fw-bold text-success">
                              R$ {p.valor.toFixed(2)}
                            </span>
                            <button
                              className="btn btn-link text-danger p-0"
                              onClick={() => handleRemovePayment(p.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      className="btn btn-warning w-100 btn-sm fw-bold shadow-sm"
                      onClick={handleSavePayments}
                      disabled={processing || newPayments.length === 0}
                    >
                      {processing ? "Processando..." : "Confirmar Pagamento"}
                    </button>
                  </div>
                </div>
              )}

              {/* Histórico de Pagamentos */}
              <div className="card border-0 shadow-sm flex-grow-1 d-flex flex-column">
                <div className="card-header bg-white fw-bold small text-secondary border-bottom">
                  Histórico de Pagamentos
                </div>
                <div
                  className="card-body p-0 overflow-auto"
                  style={{ maxHeight: "200px" }}
                >
                  <ul className="list-group list-group-flush">
                    {(sale.pagamentos || []).length === 0 && (
                      <li className="list-group-item text-center text-muted small py-3">
                        Nenhum pagamento registrado.
                      </li>
                    )}
                    {(sale.pagamentos || []).map((p) => (
                      <li
                        key={p.id_pagamento}
                        className="list-group-item d-flex justify-content-between align-items-center small"
                      >
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {p.tipo_pagamento}
                        </span>
                        <span className="fw-bold text-dark">
                          R$ {p.valor.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-footer bg-white border-top p-3">
                  {descontoGlobal > 0 && (
                    <div className="d-flex justify-content-between mb-1 small text-danger">
                      <span>Desconto Global:</span>
                      <span>- R$ {descontoGlobal.toFixed(2)}</span>
                    </div>
                  )}
                  {acrescimoGlobal > 0 && (
                    <div className="d-flex justify-content-between mb-1 small text-primary">
                      <span>Acréscimo Global:</span>
                      <span>+ R$ {acrescimoGlobal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between mb-1 small border-top pt-1">
                    <span className="fw-bold text-dark">Total Final:</span>
                    <span className="fw-bold text-dark">
                      R$ {totalVenda.toFixed(2)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-muted">Pago (Banco):</span>
                    <span className="text-success fw-bold">
                      R$ {valorJaPago.toFixed(2)}
                    </span>
                  </div>

                  {newPayments.length > 0 && (
                    <div className="d-flex justify-content-between mb-1 small text-warning-emphasis no-print">
                      <span>+ Adicionando:</span>
                      <span className="fw-bold">
                        R$ {valorNovosPagamentos.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <hr className="my-2" />

                  {faltaPagar > 0 ? (
                    <div className="d-flex justify-content-between align-items-center text-danger">
                      <span className="small fw-bold text-uppercase">
                        Falta:
                      </span>
                      <span className="fs-5 fw-bold">
                        R$ {faltaPagar.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center text-success">
                      <span className="small fw-bold text-uppercase">
                        Pago Totalmente
                      </span>
                      <FontAwesomeIcon icon={faCheck} className="fs-5" />
                    </div>
                  )}
                  {troco > 0 && (
                    <div className="text-end small text-muted mt-1">
                      Troco estimado: R$ {troco.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação (Classe 'no-print' para sumir na impressão) */}
              <div className="mt-3 d-flex gap-2 no-print">
                <button
                  className="btn btn-outline-secondary btn-sm flex-grow-1"
                  onClick={() => handlePrint()}
                >
                  <FontAwesomeIcon icon={faPrint} className="me-2" />
                  Imprimir
                </button>
                {!isCancelada && (
                  <button
                    className="btn btn-outline-danger btn-sm flex-grow-1"
                    onClick={handleCancelSale}
                    disabled={processing}
                  >
                    <FontAwesomeIcon icon={faBan} className="me-2" />
                    Cancelar Venda
                  </button>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: Itens */}
            <div className="col-12 col-md-8 p-3 bg-white d-flex flex-column overflow-hidden h-100">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
                <h5 className="fw-bold m-0 text-secondary">Itens da Venda</h5>
                <span className="badge bg-light text-secondary border">
                  {tableItems.length} Itens
                </span>
              </div>
              <div className="flex-grow-1 overflow-auto border rounded bg-light">
                <SaleItemsTable items={tableItems} readOnly={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailModal;
