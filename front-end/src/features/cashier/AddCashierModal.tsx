"use client";

import { useState, useEffect } from "react";
import { AxiosError } from "axios"; // Adicionado
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUserCheck,
  faArrowRight,
  faArrowLeft,
  faMoneyBillWave,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

// Imports originais mantidos (apenas ajustado o erro)
import api from "../../utils/api";
import { UserProfileResponse, CreateCaixaPayload } from "./types";
import { PaginatedResponse, ApiErrorResponse } from "../../types/api"; // Ajuste para incluir ApiErrorResponse

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const AddCaixaModal = ({ onClose, onSuccess }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Seleção de Usuário
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserProfileResponse | null>(
    null
  );
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Step 2: Saldo Inicial
  const [saldoInicial, setSaldoInicial] = useState<number>(0);

  // --- Carregar Usuários ---
  const fetchUsers = async (page = 1, term = "") => {
    setLoadingUsers(true);
    try {
      let url = `/profiles/paginated?page=${page}&perPage=4`;
      if (term) {
        url = `/profiles/search?term=${encodeURIComponent(
          term
        )}&page=${page}&perPage=4`;
      }

      const res = await api.get<PaginatedResponse<UserProfileResponse>>(url);

      setUsers(res.data.data);
      setUserPage(res.data.page);
      setUserTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Erro ao buscar usuários", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, "");
  }, []);

  const handleUserSearch = () => fetchUsers(1, userSearchTerm);

  // --- Submissão ---
  const handleSubmit = async () => {
    if (!selectedUser) {
      setError("Selecione um responsável.");
      return;
    }
    if (saldoInicial < 0) {
      setError("Saldo inicial não pode ser negativo.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("Sessão inválida");
      const currentUser = JSON.parse(storedUser);

      const payload: CreateCaixaPayload = {
        id_loja: currentUser.lojaId,
        saldo_inicial: saldoInicial,
        id_user_profile: selectedUser.id_user_profile,
      };

      await api.post("/caixas", payload);
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao abrir caixa.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        style={{ maxWidth: "600px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0 p-4 pb-0">
            <h5 className="modal-title fw-bold text-secondary">
              {step === 1 ? "Selecionar Responsável" : "Definir Fundo de Caixa"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}

            {step === 1 && (
              <div className="animate-fade-in">
                {/* Busca de Usuário */}
                <div className="input-group mb-3">
                  <span className="input-group-text bg-white border-end-0">
                    <FontAwesomeIcon icon={faSearch} className="text-muted" />
                  </span>
                  <input
                    className="form-control border-start-0"
                    placeholder="Buscar funcionário..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleUserSearch}
                  >
                    Buscar
                  </button>
                </div>

                {/* Lista de Usuários */}
                {loadingUsers ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-secondary" />
                  </div>
                ) : (
                  <div className="list-group mb-3">
                    {users.map((u) => (
                      <button
                        key={u.id_user_profile}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                          selectedUser?.id_user_profile === u.id_user_profile
                            ? "active bg-gradient-vl border-0 text-white"
                            : ""
                        }`}
                        onClick={() => setSelectedUser(u)}
                      >
                        <div>
                          <div className="fw-bold">{u.nome}</div>
                          <small
                            className={
                              selectedUser?.id_user_profile ===
                              u.id_user_profile
                                ? "text-white-50"
                                : "text-muted"
                            }
                          >
                            {u.cargo} • CPF: {u.cpf_cnpj}
                          </small>
                        </div>
                        {selectedUser?.id_user_profile ===
                          u.id_user_profile && (
                          <FontAwesomeIcon icon={faCheckCircle} />
                        )}
                      </button>
                    ))}
                    {users.length === 0 && (
                      <div className="text-center text-muted small py-2">
                        Nenhum funcionário encontrado.
                      </div>
                    )}
                  </div>
                )}

                {/* Paginação Usuários */}
                <div className="d-flex justify-content-center gap-2 mb-3">
                  <button
                    className="btn btn-sm btn-light"
                    disabled={userPage <= 1}
                    onClick={() => fetchUsers(userPage - 1, userSearchTerm)}
                  >
                    Anterior
                  </button>
                  <span className="small align-self-center text-muted">
                    {userPage} / {userTotalPages}
                  </span>
                  <button
                    className="btn btn-sm btn-light"
                    disabled={userPage >= userTotalPages}
                    onClick={() => fetchUsers(userPage + 1, userSearchTerm)}
                  >
                    Próxima
                  </button>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button
                    className="button-dark-grey px-4 py-2 rounded-pill"
                    disabled={!selectedUser}
                    onClick={() => setStep(2)}
                  >
                    Próximo{" "}
                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <div className="text-center mb-4">
                  <div className="bg-light rounded-circle d-inline-flex p-3 mb-2 text-success">
                    <FontAwesomeIcon icon={faUserCheck} className="fs-3" />
                  </div>
                  <h6 className="fw-bold">{selectedUser?.nome}</h6>
                  <small className="text-muted">{selectedUser?.cargo}</small>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold text-muted small">
                    Saldo Inicial (Fundo de Caixa)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FontAwesomeIcon
                        icon={faMoneyBillWave}
                        className="text-success"
                      />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-lg"
                      placeholder="0.00"
                      value={saldoInicial}
                      onChange={(e) => setSaldoInicial(Number(e.target.value))}
                      autoFocus
                    />
                  </div>
                  <div className="form-text">
                    Valor físico disponível na gaveta ao abrir.
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button
                    className="btn btn-link text-secondary text-decoration-none"
                    onClick={() => setStep(1)}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Voltar
                  </button>
                  <button
                    className="button-dark-grey px-5 py-2 rounded-pill"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Abrindo..." : "Abrir Caixa"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCaixaModal;
