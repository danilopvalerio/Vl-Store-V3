"use client";

import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faExchangeAlt,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";

import api from "../../utils/api";
import { ApiErrorResponse } from "../../types/api";

// Importando os tipos centralizados
import {
  ProfileOption,
  LoginResponse,
  SelectStorePayload,
} from "../../features/auth/types";

interface Props {
  show: boolean;
  onClose: () => void;
  currentStoreName: string;
}

const ITEMS_PER_PAGE = 10;

const StoreSwitcherModal = ({ show, onClose, currentStoreName }: Props) => {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Carregar Perfis
  useEffect(() => {
    if (show) {
      setLoading(true);
      setError("");

      api
        .get<ProfileOption[]>("/auth/me/profiles")
        .then((res) => {
          setProfiles(res.data);
        })
        .catch((err) => {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          const msg =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            "Erro ao carregar lojas.";
          setError(msg);
          console.error("Erro ao carregar lojas", err);
        })
        .finally(() => setLoading(false));
    }
  }, [show]);

  // Paginação
  const totalPages = Math.ceil(profiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = profiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Trocar de Loja
  const handleSwitch = async (profileId: string) => {
    setSwitchingId(profileId);
    setError("");

    try {
      const payload: SelectStorePayload = { profileId };
      const res = await api.post<LoginResponse>("/auth/select-store", payload);

      const { accessToken, user } = res.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      api.defaults.headers.Authorization = `Bearer ${accessToken}`;

      window.location.reload();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao trocar de loja.";

      setError(msg);
      console.error("Erro ao trocar de loja", err);
      setSwitchingId(null);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold h5 text-dark">
          <FontAwesomeIcon
            icon={faExchangeAlt}
            className="me-2 text-secondary"
          />
          Trocar de Loja
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-3 py-2 small">
            <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted small mb-3">
              Selecione uma loja para alternar o painel de controle.
            </p>

            <div className="d-flex flex-column gap-2">
              {paginatedProfiles.map((p) => {
                const isCurrent = p.lojaName === currentStoreName;
                return (
                  <button
                    key={p.id}
                    onClick={() => !isCurrent && handleSwitch(p.id)}
                    disabled={!!switchingId || isCurrent}
                    className={`btn text-start d-flex align-items-center p-3 border rounded-3 transition-all ${
                      isCurrent
                        ? "bg-light border-primary"
                        : "btn-outline-light text-dark border-secondary-subtle hover-shadow"
                    }`}
                  >
                    <div
                      className="bg-white border rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                      style={{ width: 40, height: 40 }}
                    >
                      <FontAwesomeIcon
                        icon={faStore}
                        className={
                          isCurrent ? "text-primary" : "text-secondary"
                        }
                      />
                    </div>
                    <div className="flex-grow-1 text-truncate">
                      <div className="fw-bold small text-truncate">
                        {p.lojaName}
                      </div>
                      <div
                        className="text-muted extra-small"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {p.cargo}
                      </div>
                    </div>
                    {isCurrent && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-primary ms-2"
                      />
                    )}
                    {switchingId === p.id && (
                      <div className="spinner-border spinner-border-sm text-secondary ms-2" />
                    )}
                  </button>
                );
              })}

              {paginatedProfiles.length === 0 && !error && (
                <div className="text-center text-muted small py-3">
                  Nenhuma outra loja disponível.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <button
                  className="btn btn-sm btn-light rounded-circle border"
                  style={{ width: 32, height: 32 }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || !!switchingId}
                >
                  <FontAwesomeIcon icon={faChevronLeft} size="xs" />
                </button>

                <span className="small text-muted fw-bold">
                  {currentPage} de {totalPages}
                </span>

                <button
                  className="btn btn-sm btn-light rounded-circle border"
                  style={{ width: 32, height: 32 }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || !!switchingId}
                >
                  <FontAwesomeIcon icon={faChevronRight} size="xs" />
                </button>
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default StoreSwitcherModal;
