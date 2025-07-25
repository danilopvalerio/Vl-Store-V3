import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import styles from "../../styles/ReportDisplay.module.css";
import "../../styles/General.module.css";
import ReportChart from "./reportChart";

interface ReportData {
  [key: string]: any;
}

interface ReportConfig {
  title: string;
  endpoint: string;
  requiresPeriod?: boolean;
  requiresLimit?: boolean;
  columns: Array<{
    key: string;
    label: string;
    type?: "currency" | "number" | "text";
  }>;
  // Configuração para o gráfico
  chartConfig?: {
    labelKey: string;
    dataKey: string;
    datasetLabel: string;
  };
}

interface ReportFilters {
  id_loja: string;
  dataInicio: string;
  dataFim: string;
  limite?: string;
}

const REPORT_CONFIGS: { [key: string]: ReportConfig } = {
  "produtos-mais-vendidos": {
    title: "Produtos Mais Vendidos",
    endpoint: "produtos-mais-vendidos",
    requiresPeriod: true,
    columns: [
      { key: "nome_produto", label: "Produto", type: "text" },
      { key: "referencia_produto", label: "Referência", type: "text" },
      {
        key: "total_unidades_vendidas",
        label: "Unidades Vendidas",
        type: "number",
      },
    ],
    chartConfig: {
      labelKey: "nome_produto",
      dataKey: "total_unidades_vendidas",
      datasetLabel: "Unidades Vendidas",
    },
  },
  "ranking-funcionarios": {
    title: "Ranking de Funcionários",
    endpoint: "ranking-funcionarios",
    requiresPeriod: true,
    columns: [
      { key: "nome_funcionario", label: "Funcionário", type: "text" },
      { key: "total_vendido", label: "Total Vendido", type: "currency" },
    ],
    chartConfig: {
      labelKey: "nome_funcionario",
      dataKey: "total_vendido",
      datasetLabel: "Total Vendido (R$)",
    },
  },
  financeiro: {
    title: "Relatório Financeiro",
    endpoint: "total-entradas-saidas",
    requiresPeriod: true,
    columns: [
      { key: "total_entradas", label: "Total de Entradas", type: "currency" },
      { key: "total_saidas", label: "Total de Saídas", type: "currency" },
      { key: "saldo", label: "Saldo", type: "currency" },
    ],
    // Um gráfico de barras simples não se aplica bem aqui, pois temos apenas uma linha de dados.
    // Poderia ser um gráfico com 3 barras (Entradas, Saídas, Saldo), mas exigiria um tratamento de dados diferente.
  },
  "vendas-forma-pagamento": {
    title: "Vendas por Forma de Pagamento",
    endpoint: "vendas-forma-pagamento",
    requiresPeriod: true,
    columns: [
      { key: "forma_pagamento", label: "Forma de Pagamento", type: "text" },
      { key: "total_arrecadado", label: "Total Arrecadado", type: "currency" },
      {
        key: "quantidade_transacoes",
        label: "Qtd. Transações",
        type: "number",
      },
    ],
    chartConfig: {
      labelKey: "forma_pagamento",
      dataKey: "total_arrecadado",
      datasetLabel: "Total Arrecadado (R$)",
    },
  },
  "estoque-baixo": {
    title: "Produtos com Estoque Baixo",
    endpoint: "estoque-baixo",
    requiresLimit: true,
    columns: [
      { key: "referencia", label: "Referência", type: "text" },
      { key: "nome", label: "Produto", type: "text" },
      { key: "estoque_total", label: "Estoque Total", type: "number" },
    ],
  },
};

const ReportDisplay: React.FC<{ reportType: string }> = ({ reportType }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData[]>([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ReportFilters>({
    id_loja: "",
    dataInicio: "",
    dataFim: "",
    limite: "7",
  });

  const config = REPORT_CONFIGS[reportType];
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${
      config?.title.toLowerCase().replace(/\s+/g, "-") || "relatorio"
    }.pdf`,
    bodyClass: "report-print-body",
  });

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      if (userData && userData.id_loja) {
        setFilters((prevFilters) => ({
          ...prevFilters,
          id_loja: userData.id_loja,
        }));
      }
    } else {
      console.error("Dados do usuário não encontrados no localStorage.");
      setError(
        "Não foi possível identificar a loja. Por favor, faça o login novamente."
      );
    }
  }, []);

  if (!config) {
    return <div>Tipo de relatório não encontrado</div>;
  }

  const fetchReportData = async () => {
    if (!filters.id_loja) {
      setError("ID da loja não encontrado. Verifique se está logado.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (config.requiresPeriod && (!filters.dataInicio || !filters.dataFim)) {
        setError("As datas de início e fim são obrigatórias");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (config.requiresPeriod) {
        params.append("dataInicio", filters.dataInicio);
        params.append("dataFim", filters.dataFim);
      }
      if (config.requiresLimit && filters.limite) {
        params.append("limite", filters.limite);
      }
      const url = `https://vl-store-v2.onrender.com/api/relatorios/loja/${
        filters.id_loja
      }/${config.endpoint}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
      const result = await response.json();
      if (result.success === false) {
        throw new Error(result.message || "Erro ao carregar relatório");
      }
      setData(Array.isArray(result.data) ? result.data : [result.data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return "-";
    switch (type) {
      case "currency":
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(parseFloat(value));
      case "number":
        return new Intl.NumberFormat("pt-BR").format(value);
      default:
        return value;
    }
  };

  return (
    <>
      <Head>
        <title>VL Store - {config.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.pageContainer}>
        <header className="header-panel position-relative">
          <button
            className="btn primaria position-absolute top-0 end-0 px-3 py-1 shadow"
            onClick={() => router.push("/reportsPage")}
          >
            Voltar
          </button>
          <img
            className="img logo"
            src="/vl-store-logo-white.svg"
            alt="VL Store Logo"
          />
        </header>

        <main className={styles.reportMain}>
          <div className={styles.reportCard} ref={printRef}>
            <section className={styles.reportTitleSection}>
              <div className={styles.reportTitleInfo}>
                <h1 className={styles.reportTitle}>{config.title}</h1>
                <p className={styles.reportDescription}>
                  Relatório detalhado do sistema
                </p>
                <div className={styles.reportMeta}>
                  <span>Loja: {filters.id_loja}</span>
                  {config.requiresPeriod && filters.dataInicio && (
                    <span>
                      Período:{" "}
                      {new Date(filters.dataInicio).toLocaleDateString(
                        "pt-BR",
                        { timeZone: "UTC" }
                      )}{" "}
                      a{" "}
                      {new Date(filters.dataFim).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className={styles.reportActions}>
              <button
                className={`${styles.btnPrimary} ${styles.btnDownload}`}
                onClick={() => handlePrint()}
                disabled={loading || data.length === 0}
              >
                Download PDF
              </button>
            </section>

            <section className={styles.filterSection}>
              <div className="row g-3">
                {config.requiresPeriod && (
                  <>
                    <div className="col-md-3">
                      <label
                        htmlFor="dataInicio"
                        className={styles.filterLabel}
                      >
                        Data Início
                      </label>
                      <input
                        type="date"
                        className={styles.filterInput}
                        id="dataInicio"
                        value={filters.dataInicio}
                        onChange={(e) =>
                          setFilters({ ...filters, dataInicio: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="dataFim" className={styles.filterLabel}>
                        Data Fim
                      </label>
                      <input
                        type="date"
                        className={styles.filterInput}
                        id="dataFim"
                        value={filters.dataFim}
                        onChange={(e) =>
                          setFilters({ ...filters, dataFim: e.target.value })
                        }
                        required
                      />
                    </div>
                  </>
                )}

                {config.requiresLimit && (
                  <div className="col-md-3">
                    <label htmlFor="limite" className={styles.filterLabel}>
                      Limite de Estoque
                    </label>
                    <input
                      type="number"
                      className={styles.filterInput}
                      id="limite"
                      value={filters.limite}
                      onChange={(e) =>
                        setFilters({ ...filters, limite: e.target.value })
                      }
                      min="1"
                    />
                  </div>
                )}

                <div className="col-md-3">
                  <button
                    className={styles.btnPrimary}
                    onClick={fetchReportData}
                    disabled={loading}
                    style={{ marginTop: "1.8rem" }}
                  >
                    {loading ? "Carregando..." : "Gerar Relatório"}
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.reportContent}>
              {error && (
                <div className={styles.errorContainer}>
                  <div className={styles.alertDanger}>{error}</div>
                </div>
              )}

              {loading && (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Gerando relatório...</p>
                </div>
              )}

              {!loading && data.length > 0 && (
                <>
                  <div className={styles.tableContainer}>
                    <table className={styles.reportTable}>
                      <thead>
                        <tr>
                          {config.columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, index) => (
                          <tr key={index}>
                            {config.columns.map((col) => (
                              <td key={col.key}>
                                {formatValue(row[col.key], col.type)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* RENDERIZAÇÃO DO GRÁFICO AQUI */}
                  {config.chartConfig && data.length > 0 && (
                    <ReportChart data={data} chartConfig={config.chartConfig} />
                  )}
                </>
              )}

              {!loading && data.length === 0 && !error && (
                <div className={styles.noData}>
                  <div style={{ fontSize: "4rem" }}>📊</div>
                  <h3>Nenhum dado encontrado</h3>
                  <p>
                    Configure os filtros e clique em &quot;Gerar Relatório&quot;
                    para visualizar os dados.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>

        <footer className={styles.reportFooter}>
          <p>
            &copy; {new Date().getFullYear()} VL Store. Todos os direitos
            reservados.
          </p>
        </footer>
      </div>
    </>
  );
};

export default ReportDisplay;
