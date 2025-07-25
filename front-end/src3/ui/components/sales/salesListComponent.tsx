import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import SalesDetail from "../sales/salesDetailComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faTrash,
  faFilter,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { Sale } from "../../../domain/interfaces/sale-interface";

interface SalesListProps {
  salesData?: Sale[];
  idLoja: string;
}

const ITEMS_PER_PAGE = 5;

const SalesList: React.FC<SalesListProps> = ({ salesData = [], idLoja }) => {
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dataFiltro, setDataFiltro] = useState<string>("");
  const [formaPagamentoFiltro, setFormaPagamentoFiltro] = useState<string>("");
  const [vendedorSearchTerm, setVendedorSearchTerm] = useState<string>("");
  const [vendedorSelecionadoId, setVendedorSelecionadoId] =
    useState<string>("");
  const [showVendedorDropdown, setShowVendedorDropdown] =
    useState<boolean>(false);
  const [vendedoresDisponiveis, setVendedoresDisponiveis] = useState<any[]>([]);

  const jwtToken = localStorage.getItem("jwtToken");

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.get(
          `https://vl-store-v2.onrender.com/api/funcionarios/loja/${idLoja}`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        );
        if (response.data?.success) {
          setVendedoresDisponiveis(response.data.data || []);
        }
      } catch (err) {
        console.error("Erro ao buscar vendedores:", err);
      }
    };

    if (idLoja && jwtToken) {
      fetchVendedores();
    }
  }, [idLoja, jwtToken]);

  const fetchSales = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      let url = `https://vl-store-v2.onrender.com/api/vendas/loja/${idLoja}/paginado?page=${page}&limit=${ITEMS_PER_PAGE}`;

      const params = new URLSearchParams();
      if (dataFiltro) {
        params.append("data", dataFiltro);
      }
      if (vendedorSelecionadoId) {
        params.append("funcionario_id", vendedorSelecionadoId);
      }
      if (formaPagamentoFiltro) {
        params.append("forma_pagamento", formaPagamentoFiltro);
      }

      if (params.toString()) {
        url += `&${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      if (response.data?.success) {
        setAllSales(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Erro ao buscar vendas:", err);
      setError("Não foi possível carregar as vendas do servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(currentPage);
  }, [
    idLoja,
    currentPage,
    jwtToken,
    dataFiltro,
    vendedorSelecionadoId,
    formaPagamentoFiltro,
  ]);

  useEffect(() => {
    if (salesData && salesData.length > 0) {
      setAllSales((prevSales) => {
        const newSalesToAdd = salesData.filter(
          (newSale) => !prevSales.some((s) => s.id_venda === newSale.id_venda)
        );
        return [...newSalesToAdd, ...prevSales];
      });
    }
  }, [salesData]);

  // Filtrar vendedores para dropdown
  const filteredVendedores = useMemo(() => {
    if (!vendedorSearchTerm.trim()) return vendedoresDisponiveis;

    const term = vendedorSearchTerm.toLowerCase();
    return vendedoresDisponiveis.filter(
      (v) =>
        v.nome.toLowerCase().includes(term) ||
        (v.cargo && v.cargo.toLowerCase().includes(term))
    );
  }, [vendedorSearchTerm, vendedoresDisponiveis]);

  const openModalWithSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      await axios.delete(
        `https://vl-store-v2.onrender.com/api/vendas/${saleId}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      setAllSales((prevSales) =>
        prevSales.filter((sale) => sale.id_venda !== saleId)
      );
    } catch (err) {
      console.error("Erro ao deletar venda:", err);
      setError("Erro ao deletar venda");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchSales(1);
  };

  const handleClearFilters = () => {
    setDataFiltro("");
    setFormaPagamentoFiltro("");
    setVendedorSearchTerm("");
    setVendedorSelecionadoId("");
    setCurrentPage(1);
    fetchSales(1);
  };

  const handleVendedorSelect = (vendedor: any) => {
    setVendedorSelecionadoId(vendedor.id_funcionario);
    setVendedorSearchTerm(
      `${vendedor.nome}${vendedor.cargo ? ` (${vendedor.cargo})` : ""}`
    );
    setShowVendedorDropdown(false);
  };

  return (
    <div className="quinary p-5 pb-4 mb-5 mx-auto white-light-small w-75 rounded-5">
      <div className="mb-4 mx-auto text-center d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-white">
          <i className="fas fa-list-ul mr-2"></i>Vendas Registradas
        </h5>
        <button
          className="btn btn-outline-light btn-sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FontAwesomeIcon icon={faFilter} className="mr-2" />
          {showFilters ? "Ocultar" : "Filtros"}
        </button>
      </div>

      {/* Seção de Filtros */}
      {showFilters && (
        <div className="mb-4 p-3 text-white rounded-lg">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label text-white-75 small">
                Forma de Pagamento
              </label>
              <select
                className="form-control custom-select input-form"
                value={formaPagamentoFiltro}
                onChange={(e) => setFormaPagamentoFiltro(e.target.value)}
              >
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                  value=""
                >
                  Todas
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                  value="DINHEIRO"
                >
                  Dinheiro
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                  value="CARTAO_CREDITO"
                >
                  Cartão de Crédito
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                  value="CARTAO_DEBITO"
                >
                  Cartão de Débito
                </option>
                <option
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                  value="PIX"
                >
                  PIX
                </option>
              </select>
            </div>

            <div className="col-md-4 position-relative">
              <label className="form-label text-white-75 small">Vendedor</label>
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
                <ul
                  className="list-group position-absolute w-100 mt-1 z-index-dropdown bg-dark border border-secondary rounded shadow-sm"
                  style={{
                    maxHeight: "250px",
                    overflowY: "auto",
                    zIndex: 1000,
                  }}
                >
                  {filteredVendedores.length === 0 ? (
                    <li className="list-group-item text-white bg-dark">
                      Nenhum vendedor encontrado
                    </li>
                  ) : (
                    filteredVendedores.map((v) => (
                      <li
                        key={v.id_funcionario}
                        className="list-group-item bg-dark text-white cursor-pointer hover-light"
                        onClick={() => handleVendedorSelect(v)}
                      >
                        {v.nome} {v.cargo && `(${v.cargo})`}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <div className="col-md-2 d-flex align-items-end gap-2">
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleClearFilters}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          {(dataFiltro || vendedorSelecionadoId || formaPagamentoFiltro) && (
            <div className="mt-3">
              <small className="text-white-75">Filtros ativos:</small>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {dataFiltro && (
                  <span className="badge bg-primary">
                    Data:{" "}
                    {new Date(dataFiltro + "T00:00:00").toLocaleDateString(
                      "pt-BR"
                    )}
                    <button
                      className="btn btn-link p-0 ml-1 text-white"
                      style={{ fontSize: "0.8em" }}
                      onClick={() => {
                        setDataFiltro("");
                        handleApplyFilters();
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
                {formaPagamentoFiltro && (
                  <span className="badge bg-primary">
                    Pagamento: {formaPagamentoFiltro.replace("_", " ")}
                    <button
                      className="btn btn-link p-0 ml-1 text-white"
                      style={{ fontSize: "0.8em" }}
                      onClick={() => {
                        setFormaPagamentoFiltro("");
                        handleApplyFilters();
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
                {vendedorSelecionadoId && (
                  <span className="badge bg-primary">
                    Vendedor: {vendedorSearchTerm}
                    <button
                      className="btn btn-link p-0 ml-1 text-white"
                      style={{ fontSize: "0.8em" }}
                      onClick={() => {
                        setVendedorSelecionadoId("");
                        setVendedorSearchTerm("");
                        handleApplyFilters();
                      }}
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center text-white py-4">Carregando vendas...</div>
      )}
      {error && <div className="text-center text-danger py-4">{error}</div>}

      {!loading && !error && (
        <>
          <div className="table-responsive quartenary p-3 rounded-lg mb-4">
            <table className="table table-sm table-borderless text-white">
              <thead>
                <tr className="fine-transparent-border">
                  <th className="small font-weight-bold">Data</th>
                  <th className="small font-weight-bold">Vendedor</th>
                  <th className="small font-weight-bold">Valor Total</th>
                  <th className="small font-weight-bold">Pagamento</th>
                  <th className="small font-weight-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {allSales && allSales.length > 0 ? (
                  allSales.map((sale) => (
                    <tr key={sale.id_venda} className="fine-transparent-border">
                      <td>
                        {new Date(sale.data_hora).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{sale.funcionario.nome}</td>
                      <td className="font-weight-medium">
                        R$ {parseFloat(sale.total).toFixed(2)}
                      </td>
                      <td>{sale.forma_pagamento}</td>
                      <td className="text-center">
                        <div className="btn-group gap-2" role="group">
                          <button
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "none",
                              color: "white",
                              border: "none",
                              padding: "0.375rem 0.5rem",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                            }}
                            title="Excluir"
                            onClick={() => deleteSale(sale.id_venda)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>

                          <button
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "",
                              color: "white",
                              border: "none",
                              padding: "0.375rem 0.5rem",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                            }}
                            title="Visualizar"
                            onClick={() => openModalWithSale(sale)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-white-75">
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav aria-label="Navegação de páginas">
              <div className="d-flex justify-content-center align-items-center">
                <button
                  className={`btn primaria px-4 py-2 ${
                    currentPage === 1 ? "btn-secondary" : "btn-outline-light"
                  }`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ minWidth: "80px" }}
                >
                  Anterior
                </button>

                <span className="mx-3 text-white">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  className={`btn primaria px-4 py-2 ${
                    currentPage === totalPages
                      ? "btn-secondary"
                      : "btn-outline-light"
                  }`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: "80px" }}
                >
                  Próxima
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {selectedSale && (
        <SalesDetail
          show={isModalOpen}
          onClose={closeModal}
          sale={selectedSale}
        />
      )}
    </div>
  );
};

export default SalesList;
