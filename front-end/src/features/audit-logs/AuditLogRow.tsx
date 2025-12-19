"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlusCircle,
  faPenToSquare,
  faTrashCan,
  faCircleInfo,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";

import { SystemLog } from "./types/index";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "../../types/api";

interface AuditLogRowProps {
  log: SystemLog;
}

const AuditLogRow = ({ log }: AuditLogRowProps) => {
  const [profileName, setProfileName] = useState<string>("");

  // Busca o nome do perfil usando o ID do usuário do log
  useEffect(() => {
    const fetchProfileName = async () => {
      if (log.usuario?.id) {
        try {
          const { data } = await api.get(`/profiles/user/${log.usuario.id}`);
          if (data && data.nome) {
            setProfileName(data.nome);
          }
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;

          const errorMessage =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            "Erro desconhecido ao buscar perfil";

          // Log mais limpo e informativo
          console.error(
            `Falha ao obter nome para UserID ${log.usuario.id}:`,
            errorMessage,
            `(Status: ${axiosError.response?.status})`
          );
        }
      }
    };

    fetchProfileName();
  }, [log.usuario?.id]);

  // --- Helpers Visuais ---

  // Define cor e ícone baseados no tipo de ação
  const getActionBadge = (acao: string) => {
    const upperAction = acao.toUpperCase();

    if (upperAction.includes("CRIAR") || upperAction.includes("REGISTRAR")) {
      return (
        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">
          <FontAwesomeIcon icon={faPlusCircle} className="me-1" />
          Criação
        </span>
      );
    }
    if (upperAction.includes("ATUALIZAR") || upperAction.includes("EDITAR")) {
      return (
        <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">
          <FontAwesomeIcon icon={faPenToSquare} className="me-1" />
          Edição
        </span>
      );
    }
    if (upperAction.includes("REMOVER") || upperAction.includes("DELETAR")) {
      return (
        <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle">
          <FontAwesomeIcon icon={faTrashCan} className="me-1" />
          Remoção
        </span>
      );
    }
    // Padrão
    return (
      <span className="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle">
        <FontAwesomeIcon icon={faCircleInfo} className="me-1" />
        Outros
      </span>
    );
  };

  return (
    <tr>
      {/* DATA */}
      <td className="fw-medium text-secondary" style={{ width: "160px" }}>
        {log.data || "-"}
      </td>

      {/* TIPO DA AÇÃO */}
      <td className="text-center" style={{ width: "120px" }}>
        {getActionBadge(log.acao)}
      </td>

      {/* AÇÃO / DETALHES */}
      <td>
        <div className="d-flex flex-column">
          <span className="fw-bold text-dark text-uppercase small mb-1">
            {log.acao}
          </span>
          <span className="text-muted small text-break">
            {log.detalhes || "Sem detalhes adicionais."}
          </span>
        </div>
      </td>

      {/* RESPONSÁVEL (ATOR) */}
      <td>
        {log.usuario ? (
          <div className="d-flex align-items-center">
            <div
              className="bg-light rounded-circle d-flex justify-content-center align-items-center me-2 text-secondary"
              style={{ width: "32px", height: "32px" }}
            >
              <FontAwesomeIcon icon={faUserGear} />
            </div>
            <div className="d-flex flex-column">
              <span
                className="fw-bold text-dark"
                style={{ fontSize: "0.85rem" }}
              >
                {profileName || "Usuário do Sistema"}
              </span>
              <span
                className="small text-muted"
                style={{ fontSize: "0.75rem" }}
              >
                {log.usuario.email}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-muted fst-italic small">
            Usuário Removido ou Sistema
          </span>
        )}
      </td>
    </tr>
  );
};

export default AuditLogRow;
