"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";

import api from "../../../utils/api";
import { PaginatedResponse } from "@/types/api";
import { Sale } from "../../../features/sales/types";

// Componentes
import SaleCard from "../../../features/sales/SaleCard";
import AddSaleModal from "../../../features/sales/AddSaleModal";
import SaleDetailModal from "../../../features/sales/SaleDetailModal"; // NOVO IMPORT

const SalesPage = () => {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null); // ESTADO PARA SELEÇÃO

  const fetchSales = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Sale>>(
        `/vendas/paginated?page=${pageNum}&perPage=8`
      );
      setSales(res.data.data);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(1);
  }, []);

  const handleRefresh = () => {
    setIsAddModalOpen(false);
    setSelectedSaleId(null); // Fecha detalhes se estiver aberto
    fetchSales(page); // Recarrega a página atual para ver mudanças de status
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#e9e9e9" }}
    >
      {/* Header */}
      <header className="header-panel bg-gradient-vl d-flex align-items-center bg-dark px-2">
        <button
          className="btn btn-link text-white ms-0"
          onClick={() => router.push("/dashboard")}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="fs-4" />
        </button>
      </header>

      <div className="container my-5 flex-grow-1">
        <div className="bg-white border rounded-4 shadow-sm overflow-hidden">
          <div className="bg-gradient-vl p-4 text-center text-white">
            <h3 className="fw-bold m-0">Gestão de Vendas</h3>
            <p className="m-0 opacity-75 small">
              PDV e Histórico de Transações
            </p>
          </div>

          <div className="p-4">
            {/* Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <button
                className="button-dark-grey rounded-pill pe-3 ps-3 d-flex align-items-center justify-content-center"
                style={{
                  height: "40px",
                  minWidth: "150px",
                }}
                onClick={() => setIsAddModalOpen(true)}
              >
                <span className="me-2">Adicionar venda</span>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>

            {/* Lista */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" />
              </div>
            ) : sales.length > 0 ? (
              <>
                <div className="row g-3">
                  {sales.map((sale) => (
                    <div
                      key={sale.id_venda}
                      className="col-12 col-md-6 col-lg-3"
                    >
                      <SaleCard
                        sale={sale}
                        onClick={() => setSelectedSaleId(sale.id_venda)} // AÇÃO AO CLICAR
                      />
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button
                    className="btn btn-sm btn-outline-secondary rounded-pill"
                    disabled={page <= 1}
                    onClick={() => fetchSales(page - 1)}
                  >
                    Anterior
                  </button>
                  <span className="small align-self-center fw-bold">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary rounded-pill"
                    disabled={page >= totalPages}
                    onClick={() => fetchSales(page + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-muted">
                Nenhuma venda registrada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação */}
      {isAddModalOpen && (
        <AddSaleModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Modal de Detalhes (Visualização/Pagamento/Cancelamento) */}
      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default SalesPage;
