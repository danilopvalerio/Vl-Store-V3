import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, Plus } from "lucide-react";
import styles from "../../styles/cashierPage.module.css";
import axios from "axios";

interface Movimentacao {
  id_movimentacao: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  descricao: string;
  criado_em: string;
}

interface Caixa {
  id_caixa: string;
  status: "ABERTO" | "FECHADO";
  entradas?: number;
  saidas?: number;
  saldo?: number;
  responsavel?: string;
  data_abertura?: string;
  hora_abertura?: string;
  hora_fechamento?: string | null;
}

interface MovimentacaoAllResponse {
  success: boolean;
  data: {
    movimentacoes: Movimentacao[];
    totalEntradas: number;
    totalSaidas: number;
    saldo: number;
  };
  totalItems: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface CardInfoProps {
  titulo: string;
  valor: string;
  className: string;
}

interface CashierDetailsProps {
  caixa: Caixa | null;
  onBack: () => void;
  onUpdateCaixa: (updatedCaixa: Caixa) => void;
  onCloseCaixa: (closedCaixa: Caixa) => void;
}

interface MovimentacaoState {
  tipo: "ENTRADA" | "SAIDA";
  valor: string;
  descricao: string;
}

export const formatCurrency = (value: number | null | undefined): string => {
  const numericValue = typeof value === "number" ? value : 0;
  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatDateTime = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateTimeString;
  }
};

const CardInfo: React.FC<CardInfoProps> = ({ titulo, valor, className }) => (
  <div className={styles.box}>
    <div className={styles.textSecondary}>{titulo}</div>
    <div
      className={`${className} ${styles.textPrimary}`}
      style={{ fontSize: "2rem" }}
    >
      {valor}
    </div>
  </div>
);

const CashierDetails: React.FC<CashierDetailsProps> = ({
  caixa,
  onBack,
  onUpdateCaixa,
  onCloseCaixa,
}) => {
  const [movimentacao, setMovimentacao] = useState<MovimentacaoState>({
    tipo: "ENTRADA",
    valor: "",
    descricao: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const loadMovimentacoes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<PaginatedResponse<Movimentacao>>(
        `https://vl-store-v2.onrender.com/api/caixas/${caixa?.id_caixa}/movimentacoes?page=${pagination.page}&limit=${pagination.limit}`,
        { headers: getAuthHeaders() }
      );
      const movimentacoes = response.data.data;
      const movimentacoesParaExibir = movimentacoes.map((mov: any) => ({
        ...mov,
        valor: parseFloat(mov.valor),
      }));
      setMovimentacoes(movimentacoesParaExibir);

      setPagination((prev) => ({ ...prev, total: response.data.total }));
    } catch (err) {
      console.error("Erro ao carregar movimentações:", err);
      setError("Erro ao carregar movimentações");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarTotais = async () => {
    if (!caixa?.id_caixa) return;

    try {
      const response = await axios.get<MovimentacaoAllResponse>(
        `https://vl-store-v2.onrender.com/api/caixas/${caixa.id_caixa}/movimentacoes/all`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const { totalEntradas, totalSaidas, saldo } = response.data.data;
        onUpdateCaixa({
          ...caixa!,
          entradas: totalEntradas,
          saidas: totalSaidas,
          saldo: saldo,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar resumo do caixa:", err);
    }
  };

  const validateAndParseValue = (value: string): number | null => {
    const cleanValue = value.trim().replace(",", ".");
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? null : Math.round(numericValue * 100) / 100;
  };

  const handleAddMovimentacao = async () => {
    if (!caixa?.id_caixa) return;

    const valorFloat = validateAndParseValue(movimentacao.valor);
    if (valorFloat === null || valorFloat <= 0) {
      setError("Insira um valor numérico válido maior que zero.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!movimentacao.descricao.trim()) {
      setError("Insira uma descrição.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `https://vl-store-v2.onrender.com/api/caixas/${caixa.id_caixa}/movimentacoes`,
        { ...movimentacao, valor: valorFloat },
        { headers: getAuthHeaders() }
      );
      setMovimentacao({ tipo: "ENTRADA", valor: "", descricao: "" });
      setPagination((prev) => ({ ...prev, page: 1 }));
      await atualizarTotais();
      setSuccess("Movimentação adicionada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Erro ao adicionar movimentação:", err);
      setError(
        err.response?.data?.message || "Erro ao adicionar movimentação."
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseCaixa = async () => {
    if (!caixa?.id_caixa) return;
    if (window.confirm("Tem certeza que deseja fechar o caixa?")) {
      setIsLoading(true);
      try {
        const response = await axios.patch<Caixa>(
          `https://vl-store-v2.onrender.com/api/caixas/${caixa.id_caixa}/fechar`,
          { hora_fechamento: new Date().toTimeString().split(" ")[0] },
          { headers: getAuthHeaders() }
        );
        onCloseCaixa(response.data);
        setSuccess("Caixa fechado com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        console.error("Erro ao fechar caixa:", err);
        setError(err.response?.data?.message || "Erro ao fechar caixa.");
        setTimeout(() => setError(""), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (caixa?.id_caixa) {
      loadMovimentacoes();
      atualizarTotais();
    }
  }, [caixa?.id_caixa, pagination.page, pagination.limit]);

  const saldo = caixa?.saldo ?? 0;

  const hasNextPage = pagination.page * pagination.limit < pagination.total;
  const hasPreviousPage = pagination.page > 1;

  if (!caixa) return <div>Carregando detalhes do caixa...</div>;

  const handlePageChange = (newPage: number) =>
    setPagination({ ...pagination, page: newPage });

  if (!caixa) return <div>Carregando detalhes do caixa...</div>;

  return (
    <>
      <div
        className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter} ${styles.mb6}`}
      >
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className={styles.pageTitle}>Detalhes do Caixa</h2>
        {caixa.status === "ABERTO" && (
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleCloseCaixa}
            disabled={isLoading}
          >
            <Lock size={16} /> {isLoading ? "Fechando..." : "Fechar Caixa"}
          </button>
        )}
      </div>

      {error && (
        <div className={`${styles.alert} ${styles.alertDanger}`}>{error}</div>
      )}
      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          {success}
        </div>
      )}

      <div
        className={`${styles.grid} ${styles.gap4} ${styles.mb6}`}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
      >
        <CardInfo
          titulo="Total de Entradas"
          valor={formatCurrency(caixa.entradas)}
          className={styles.textSuccess}
        />
        <CardInfo
          titulo="Total de Saídas"
          valor={formatCurrency(caixa.saidas)}
          className={styles.textDanger}
        />
        <CardInfo
          titulo="Saldo Atual"
          valor={formatCurrency(saldo)}
          className={styles.textAccent}
        />
      </div>

      {caixa.status === "ABERTO" && (
        <div className={`${styles.box} ${styles.mb6}`}>
          <h3
            className={`${styles.pageTitle} ${styles.mb4}`}
            style={{ fontSize: "1.25rem" }}
          >
            Adicionar Movimentação
          </h3>
          <div
            className={`${styles.grid} ${styles.gap4} ${styles.itemsCenter}`}
            style={{ gridTemplateColumns: "1fr 1fr 2fr 0.5fr" }}
          >
            <select
              className={styles.inputForm}
              value={movimentacao.tipo}
              onChange={(e) =>
                setMovimentacao({
                  ...movimentacao,
                  tipo: e.target.value as "ENTRADA" | "SAIDA",
                })
              }
              disabled={isLoading}
            >
              <option
                className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                value="ENTRADA"
              >
                Entrada
              </option>
              <option
                className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                value="SAIDA"
              >
                Saída
              </option>
            </select>
            <input
              type="text"
              placeholder="Valor (ex: 80,00)"
              className={styles.inputForm}
              value={movimentacao.valor}
              onChange={(e) =>
                setMovimentacao({ ...movimentacao, valor: e.target.value })
              }
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="Descrição"
              className={styles.inputForm}
              value={movimentacao.descricao}
              onChange={(e) =>
                setMovimentacao({ ...movimentacao, descricao: e.target.value })
              }
              disabled={isLoading}
            />
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleAddMovimentacao}
              disabled={isLoading}
            >
              {isLoading ? "..." : <Plus size={16} />}
            </button>
          </div>
        </div>
      )}

      <div className={styles.box}>
        <h3
          className={`${styles.pageTitle} ${styles.mb4}`}
          style={{ fontSize: "1.25rem" }}
        >
          Histórico de Movimentações
        </h3>
        {movimentacoes.length === 0 ? (
          <p className={styles.textSecondary}>
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map((mov) => (
                    <tr key={mov.id_movimentacao}>
                      <td>{formatDateTime(mov.criado_em)}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            mov.tipo === "ENTRADA"
                              ? styles.success
                              : styles.danger
                          }`}
                        >
                          {mov.tipo}
                        </span>
                      </td>
                      <td>{mov.descricao}</td>
                      <td
                        className={
                          mov.tipo === "ENTRADA"
                            ? styles.textSuccess
                            : styles.textDanger
                        }
                      >
                        {formatCurrency(mov.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter} ${styles.mt4}`}
            >
              {hasPreviousPage && (
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={isLoading}
                >
                  Anterior
                </button>
              )}
              {hasNextPage && (
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={isLoading}
                >
                  Próxima
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CashierDetails;
