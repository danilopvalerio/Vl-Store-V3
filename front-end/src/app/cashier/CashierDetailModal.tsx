// app/caixas/CaixaDetailModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faTrash,
  faPlus,
  faSave,
  faLock,
  faUnlock,
  faUserEdit,
  faSearch,
  faMoneyBillWave,
  faCashRegister,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import { getErrorMessage } from "../../utils/errorUtils";
import {
  CaixaResponse,
  MovimentacaoResponse,
  PaginatedResponse,
  TipoMovimentacao,
  UserProfileResponse,
  ToggleStatusPayload,
  UpdateResponsiblePayload,
  CaixaDashboardResponse,
  DashboardStats,
} from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const faUserExchange = faUserEdit;

interface Props {
  caixaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CaixaDetailModal = ({ caixaId, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(true);

  // Dados Principais
  const [caixa, setCaixa] = useState<CaixaResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [successMsg, setSuccessMsg] = useState("");

  // Permissões
  const [canManage, setCanManage] = useState(false);

  // Movimentações (Lista)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>(
    []
  );
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);

  // Form Adicionar Movimentação
  const [isAddingMov, setIsAddingMov] = useState(false);
  const [newMovTipo, setNewMovTipo] = useState<TipoMovimentacao>("SANGRIA");
  const [newMovValor, setNewMovValor] = useState(0);
  const [newMovDesc, setNewMovDesc] = useState("");

  // Troca de Responsável
  const [isChangingUser, setIsChangingUser] = useState(false);
  const [users, setUsers] = useState<UserProfileResponse[]>([]);

  // Fechamento
  const [isClosing, setIsClosing] = useState(false);
  const [saldoFechamento, setSaldoFechamento] = useState(0);

  // --- LOADERS ---

  const loadDashboard = useCallback(async () => {
    try {
      // Chama o endpoint que retorna Caixa + Estatísticas
      const res = await api.get<CaixaDashboardResponse>(
        `/caixas/${caixaId}/dashboard`
      );
      setCaixa(res.data.caixa);
      setStats(res.data.estatisticas);

      // Sugere o saldo calculado para o fechamento
      if (res.data.estatisticas) {
        setSaldoFechamento(res.data.estatisticas.saldo_atual);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [caixaId]);

  const loadMovimentacoes = useCallback(
    async (page = 1) => {
      try {
        const url = `/caixas/movimentacoes?caixaId=${caixaId}&page=${page}&perPage=5`;
        const res = await api.get<PaginatedResponse<MovimentacaoResponse>>(url);
        setMovimentacoes(res.data.data);
        setMovTotalPages(res.data.totalPages);
        setMovPage(res.data.page);
      } catch (err) {
        console.error(getErrorMessage(err));
      }
    },
    [caixaId]
  );

  // --- INIT ---
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCanManage(["ADMIN", "SUPER_ADMIN", "GERENTE"].includes(user.role));
    }
    loadDashboard();
    loadMovimentacoes(1);
  }, [loadDashboard, loadMovimentacoes]);

  // --- ACTIONS ---

  const handleAddMovimentacao = async () => {
    if (newMovValor <= 0) return alert("Valor inválido");
    try {
      await api.post("/caixas/movimentacoes", {
        id_caixa: caixaId,
        tipo: newMovTipo,
        valor: newMovValor,
        descricao: newMovDesc,
      });
      setIsAddingMov(false);
      setNewMovValor(0);
      setNewMovDesc("");

      await loadDashboard(); // Atualiza os cards de saldo
      loadMovimentacoes(1); // Atualiza a lista

      setSuccessMsg("Movimentação registrada!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteMov = async (id: string) => {
    if (!confirm("Tem certeza? Isso altera o saldo do caixa.")) return;
    try {
      await api.delete(`/caixas/movimentacoes/${id}`);
      await loadDashboard();
      loadMovimentacoes(movPage);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleToggleStatus = async () => {
    try {
      const payload: ToggleStatusPayload = {};
      if (caixa?.status === "ABERTO" || caixa?.status === "REABERTO") {
        payload.saldo_final = saldoFechamento;
      }

      await api.patch(`/caixas/${caixaId}/status`, payload);
      await loadDashboard();
      setIsClosing(false);
      onSuccess();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // --- TROCA DE RESPONSÁVEL ---
  const searchUsers = async (term: string) => {
    if (!term) return;
    try {
      const res = await api.get<PaginatedResponse<UserProfileResponse>>(
        `/profiles/search?term=${term}&perPage=5`
      );
      setUsers(res.data.data);
    } catch (err) {
      console.error(getErrorMessage(err));
    }
  };

  const handleChangeResponsible = async (userId: string) => {
    if (!confirm("Confirmar troca de responsável?")) return;
    try {
      const payload: UpdateResponsiblePayload = { id_user_profile: userId };
      await api.patch(`/caixas/${caixaId}/responsible`, payload);
      setIsChangingUser(false);
      await loadDashboard();
      onSuccess();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const toBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading)
    return <div className="modal-backdrop show bg-dark bg-opacity-50" />;

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        style={{ maxWidth: "900px", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow">
          {/* HEADER */}
          <div className="modal-header border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold text-secondary">
                <FontAwesomeIcon
                  icon={faCashRegister}
                  className="me-2 text-muted"
                />
                Painel do Caixa
              </h5>
              <div className="d-flex align-items-center gap-2 mt-1">
                <span
                  className={`badge ${
                    caixa?.status === "FECHADO" ? "bg-secondary" : "bg-success"
                  }`}
                >
                  {caixa?.status}
                </span>
                <span className="text-muted small">
                  Resp: <strong>{caixa?.nome_responsavel || "N/A"}</strong>
                </span>
                {canManage && caixa?.status !== "FECHADO" && (
                  <button
                    className="btn btn-sm btn-link p-0 ms-1 text-secondary"
                    onClick={() => setIsChangingUser(!isChangingUser)}
                  >
                    <FontAwesomeIcon
                      icon={faUserExchange}
                      title="Trocar Responsável"
                    />
                  </button>
                )}
              </div>

              {/* Busca Responsável (Overlay) */}
              {isChangingUser && (
                <div
                  className="mt-2 bg-white p-2 rounded shadow position-absolute border"
                  style={{ zIndex: 100, width: "300px" }}
                >
                  <div className="input-group input-group-sm mb-2">
                    <span className="input-group-text bg-white">
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="Buscar funcionário..."
                      onChange={(e) => searchUsers(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div
                    className="list-group"
                    style={{ maxHeight: "150px", overflowY: "auto" }}
                  >
                    {users.map((u) => (
                      <button
                        key={u.id_user_profile}
                        className="list-group-item list-group-item-action py-1 small border-0"
                        onClick={() =>
                          handleChangeResponsible(u.id_user_profile)
                        }
                      >
                        {u.nome}
                      </button>
                    ))}
                  </div>
                  <div className="text-end mt-2">
                    <button
                      className="btn btn-xs btn-light text-secondary"
                      onClick={() => setIsChangingUser(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 pt-3">
            {successMsg && (
              <div className="alert alert-success py-2 small">{successMsg}</div>
            )}

            {/* --- DASHBOARD ESTATÍSTICO --- */}
            <div className="row g-3 mb-4">
              {/* Coluna 1: Saldo */}
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded border h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">
                  <div className="position-absolute end-0 top-0 p-3 opacity-25">
                    <FontAwesomeIcon
                      icon={faMoneyBillWave}
                      size="3x"
                      className="text-secondary"
                    />
                  </div>
                  <span className="text-muted small fw-bold text-uppercase">
                    Saldo em Caixa
                  </span>
                  <h3 className="fw-bold text-dark my-2">
                    {toBRL(stats?.saldo_atual || 0)}
                  </h3>
                  <small className="text-muted" style={{ fontSize: "0.8rem" }}>
                    Inicial: {toBRL(Number(caixa?.saldo_inicial || 0))}
                  </small>
                </div>
              </div>

              {/* Coluna 2: Detalhamento */}
              <div className="col-12 col-md-8">
                <div className="row g-2 h-100">
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-success-subtle rounded border border-success-subtle h-100 text-center">
                      <span className="d-block text-success small fw-bold mb-1">
                        Vendas
                      </span>
                      <span className="d-block fw-bold text-dark">
                        {toBRL(stats?.detalhado.VENDA || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-primary-subtle rounded border border-primary-subtle h-100 text-center">
                      <span className="d-block text-primary small fw-bold mb-1">
                        Suprimentos
                      </span>
                      <span className="d-block fw-bold text-dark">
                        {toBRL(stats?.detalhado.SUPRIMENTO || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-warning-subtle rounded border border-warning-subtle h-100 text-center">
                      <span className="d-block text-warning-emphasis small fw-bold mb-1">
                        Sangrias
                      </span>
                      <span className="d-block fw-bold text-dark">
                        {toBRL(stats?.detalhado.SANGRIA || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 bg-danger-subtle rounded border border-danger-subtle h-100 text-center">
                      <span className="d-block text-danger small fw-bold mb-1">
                        Despesas
                      </span>
                      <span className="d-block fw-bold text-dark">
                        {toBRL(stats?.detalhado.SAIDA || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- STATUS CONTROLS --- */}
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
              <div>
                <span className="small text-muted me-2">
                  Saldo Final Registrado:
                </span>
                <span className="fw-bold font-monospace">
                  {caixa?.saldo_final ? toBRL(Number(caixa.saldo_final)) : "--"}
                </span>
              </div>

              {caixa?.status === "FECHADO" ? (
                <button
                  className="btn btn-outline-success btn-sm rounded-pill px-3"
                  onClick={handleToggleStatus}
                >
                  <FontAwesomeIcon icon={faUnlock} className="me-2" /> Reabrir
                  Caixa
                </button>
              ) : !isClosing ? (
                <button
                  className="btn btn-outline-danger btn-sm rounded-pill px-3"
                  onClick={() => setIsClosing(true)}
                >
                  <FontAwesomeIcon icon={faLock} className="me-2" /> Fechar
                  Caixa
                </button>
              ) : (
                <div className="d-flex align-items-center gap-2 bg-light p-1 px-2 rounded border animate-fade-in">
                  <small className="fw-bold text-muted">Conferência:</small>
                  <input
                    type="number"
                    className="form-control form-control-sm border-secondary"
                    placeholder="Valor na Gaveta"
                    style={{ width: "120px" }}
                    value={saldoFechamento}
                    onChange={(e) => setSaldoFechamento(Number(e.target.value))}
                    autoFocus
                  />
                  <button
                    className="btn btn-success btn-sm py-0 h-100"
                    onClick={handleToggleStatus}
                  >
                    OK
                  </button>
                  <button
                    className="btn btn-link btn-sm text-secondary text-decoration-none py-0"
                    onClick={() => setIsClosing(false)}
                  >
                    X
                  </button>
                </div>
              )}
            </div>

            {/* --- LISTAGEM --- */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-secondary m-0">
                Histórico de Movimentações
              </h6>
              {caixa?.status !== "FECHADO" && (
                <button
                  className={`btn btn-sm rounded-pill px-3 ${
                    isAddingMov ? "btn-light border" : "btn-dark"
                  }`}
                  onClick={() => setIsAddingMov(!isAddingMov)}
                >
                  <FontAwesomeIcon
                    icon={isAddingMov ? faTimes : faPlus}
                    className="me-1"
                  />
                  {isAddingMov ? "Cancelar" : "Lançar"}
                </button>
              )}
            </div>

            {/* FORM ADICIONAR */}
            {isAddingMov && (
              <div className="bg-light p-3 rounded mb-3 animate-fade-in border">
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label small fw-bold mb-0">
                      Tipo
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={newMovTipo}
                      onChange={(e) =>
                        setNewMovTipo(e.target.value as TipoMovimentacao)
                      }
                    >
                      <option value="SANGRIA">Sangria (Saída)</option>
                      <option value="SUPRIMENTO">Suprimento (Entrada)</option>
                      <option value="SAIDA">Despesa (Saída)</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold mb-0">
                      Valor
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={newMovValor}
                      onChange={(e) => setNewMovValor(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold mb-0">
                      Descrição
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Motivo..."
                      value={newMovDesc}
                      onChange={(e) => setNewMovDesc(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      className="btn btn-success btn-sm w-100"
                      onClick={handleAddMovimentacao}
                    >
                      <FontAwesomeIcon icon={faSave} className="me-1" /> Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TABELA */}
            <div className="table-responsive border rounded mb-3">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Hora</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th className="text-end">Valor</th>
                    <th className="text-center" style={{ width: "50px" }}>
                      Del
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map((m) => {
                    const date = new Date(m.data_criacao);
                    const isValid = !isNaN(date.getTime());
                    const isEntrada =
                      m.tipo === "ENTRADA" || m.tipo === "SUPRIMENTO";

                    return (
                      <tr key={m.id_movimentacao}>
                        <td className="ps-3 text-muted">
                          {isValid
                            ? format(date, "HH:mm", { locale: ptBR })
                            : "--:--"}
                        </td>
                        <td>
                          <span
                            className={`badge border ${
                              isEntrada
                                ? "bg-success-subtle text-success border-success-subtle"
                                : "bg-danger-subtle text-danger border-danger-subtle"
                            }`}
                          >
                            {m.tipo}
                          </span>
                        </td>
                        <td
                          className="text-truncate"
                          style={{ maxWidth: "150px" }}
                          title={m.descricao || ""}
                        >
                          {m.descricao || "-"}
                        </td>
                        <td
                          className={`text-end font-monospace fw-bold ${
                            isEntrada ? "text-success" : "text-danger"
                          }`}
                        >
                          {isEntrada ? "+" : "-"} {toBRL(Number(m.valor))}
                        </td>
                        <td className="text-center">
                          {canManage &&
                            caixa?.status !== "FECHADO" &&
                            m.tipo !== "ENTRADA" && (
                              <button
                                className="btn btn-link text-muted p-0 hover-danger"
                                onClick={() =>
                                  handleDeleteMov(m.id_movimentacao)
                                }
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                  {movimentacoes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">
                        Nenhuma movimentação.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {movTotalPages > 1 && (
              <div className="d-flex justify-content-center gap-2">
                <button
                  className="btn btn-sm btn-light border"
                  disabled={movPage <= 1}
                  onClick={() => loadMovimentacoes(movPage - 1)}
                >
                  {"<"}
                </button>
                <span className="small align-self-center text-muted">
                  Página {movPage} de {movTotalPages}
                </span>
                <button
                  className="btn btn-sm btn-light border"
                  disabled={movPage >= movTotalPages}
                  onClick={() => loadMovimentacoes(movPage + 1)}
                >
                  {">"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaixaDetailModal;
