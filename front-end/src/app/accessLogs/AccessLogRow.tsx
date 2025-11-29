"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faDesktop,
  faMobile,
  faTablet,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api"; // Ajuste o caminho se necessário

export interface AccessLog {
  id_log_acesso: string;
  data: string | null;
  ip: string | null;
  user_agent: string | null;
  sucesso: boolean | null;
  usuario?: {
    id: string;
    email: string;
    nome?: string;
  };
}

interface AccessLogRowProps {
  log: AccessLog;
}

const AccessLogRow = ({ log }: AccessLogRowProps) => {
  // Estado para armazenar o nome real do funcionário
  const [profileName, setProfileName] = useState<string>("");

  // Busca o nome do perfil usando o ID do usuário do log
  useEffect(() => {
    const fetchProfileName = async () => {
      if (log.usuario?.id && log.sucesso) {
        try {
          const { data } = await api.get(`/profiles/user/${log.usuario.id}`);
          if (data && data.nome) {
            setProfileName(data.nome);
          }
        } catch (error) {
          console.log(error);
          console.error("Nome não encontrado para user:", log.usuario.id);
        }
      }
    };

    fetchProfileName();
  }, [log.usuario?.id, log.sucesso]);

  // --- Helpers de Formatação ---

  const getDeviceIcon = (ua: string | null) => {
    if (!ua) return faDesktop;
    const lowerUA = ua.toLowerCase();
    if (
      lowerUA.includes("mobile") ||
      lowerUA.includes("android") ||
      lowerUA.includes("iphone")
    )
      return faMobile;
    if (lowerUA.includes("ipad") || lowerUA.includes("tablet")) return faTablet;
    return faDesktop;
  };

  const formatUserAgent = (ua: string | null) => {
    if (!ua) return "-";

    let browser = "Desconhecido";
    let os = "Desconhecido";

    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS") || ua.includes("iPhone")) os = "iOS";

    if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

    if (browser !== "Desconhecido" && os !== "Desconhecido") {
      return `${browser} no ${os}`;
    }

    if (ua.length > 50) return ua.substring(0, 47) + "...";
    return ua;
  };

  return (
    <tr>
      {/* STATUS */}
      <td className="text-center" style={{ width: "80px" }}>
        {log.sucesso ? (
          <span
            className="badge rounded-pill bg-success-subtle text-success border border-success-subtle"
            title="Acesso Permitido"
          >
            <FontAwesomeIcon icon={faCircleCheck} className="me-1" />
            Sucesso
          </span>
        ) : (
          <span
            className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle"
            title="Acesso Negado ou Falha"
          >
            <FontAwesomeIcon icon={faCircleXmark} className="me-1" />
            Falha
          </span>
        )}
      </td>

      {/* DATA */}
      <td className="fw-medium text-secondary">{log.data || "-"}</td>

      {/* USUÁRIO (COM O NOME REAL) */}
      <td>
        {log.usuario ? (
          <div className="d-flex flex-column">
            {/* Se tiver nome do perfil, mostra ele. Se não, mostra o email como principal */}
            <span className="fw-bold text-dark">
              {profileName || log.usuario.email}
            </span>

            {/* Se tiver nome, o email fica embaixo menorzinho. Se não, mostra o ID */}
            {profileName ? (
              <span
                className="small text-muted"
                style={{ fontSize: "0.75rem" }}
              >
                {log.usuario.email}
              </span>
            ) : (
              <span
                className="small text-muted"
                style={{ fontSize: "0.75rem" }}
              >
                ID: {log.usuario.id.substring(0, 8)}...
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted fst-italic">Desconhecido / Falha</span>
        )}
      </td>

      {/* IP */}
      <td className="text-secondary font-monospace small">{log.ip || "N/A"}</td>

      {/* DISPOSITIVO */}
      <td className="text-secondary small">
        <div className="d-flex align-items-center" title={log.user_agent || ""}>
          <FontAwesomeIcon
            icon={getDeviceIcon(log.user_agent)}
            className="me-2 opacity-50"
          />
          <span
            className="d-inline-block text-truncate"
            style={{ maxWidth: "200px" }}
          >
            {formatUserAgent(log.user_agent)}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default AccessLogRow;
