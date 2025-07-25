import React, { useState, useEffect } from "react";
import axios from "axios";
import { Sale } from "../../../domain/interfaces/sale-interface";

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
};

type SaleInfoProps = {
  sale: Sale;
};

type ProductsTableProps = {
  products?: Sale["itens"];
};

type SaleSummaryProps = {
  sale: Sale;
  subtotalProdutos: number;
};

type ModalFooterProps = {
  onClose: () => void;
};

type SalesDetailProps = {
  show: boolean;
  onClose: () => void;
  sale?: Sale;
};

const formatCurrency = (value: number | string) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return `R$ ${Number(numValue || 0).toFixed(2)}`;
};

const ModalHeader = ({ title, onClose }: ModalHeaderProps) => (
  <div className="d-flex justify-content-between align-items-center p-3 fine-transparent-border-bottom">
    <h5 className="modal-title text-white mb-0">
      <i className="fas fa-file-invoice-dollar mr-2"></i>
      {title}
    </h5>
    <button
      type="button"
      className="close text-white"
      onClick={onClose}
      aria-label="Close"
      style={{ fontSize: "1.5rem", background: "none", border: "none" }}
    >
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
);

const SaleInfo = ({ sale }: SaleInfoProps) => (
  <div className="p-3 text-white-50">
    <p>
      <strong>Código da Venda:</strong> {sale.id_venda}
    </p>
    <p>
      <strong>Data e Hora:</strong>{" "}
      {`${new Date(sale.data_hora).toLocaleDateString("pt-BR")} - ${new Date(
        sale.data_hora
      ).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`}
    </p>
    <p>
      <strong>Vendedor:</strong> {sale.funcionario.nome}
    </p>
    <p className="mb-0">
      <strong>Forma de Pagamento:</strong> {sale.forma_pagamento}
    </p>
  </div>
);

const ProductsTable = ({ products }: ProductsTableProps) => {
  const [productNames, setProductNames] = useState<{ [key: string]: string }>(
    {}
  );

  const getProductName = async (
    referencia: string,
    id_loja: string
  ): Promise<string> => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) return "Token não encontrado";
      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/produtos/loja/${id_loja}/referencia/${referencia}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          timeout: 2000,
        }
      );

      return response.data.data.nome || "Nome não disponível";
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return "Erro ao carregar";
    }
  };

  useEffect(() => {
    const fetchProductNames = async () => {
      if (!products) return;

      const names: { [key: string]: string } = {};

      await Promise.all(
        products.map(async (item) => {
          if (item && item.variacao) {
            const name = await getProductName(
              item.variacao.referencia_produto,
              item.variacao.id_loja || ""
            );
            names[item.variacao.referencia_produto] = name;
          }
        })
      );

      setProductNames(names);
    };

    fetchProductNames();
  }, [products]);

  return (
    <div className="p-3">
      <h6 className="text-white">Produtos:</h6>
      <div className="table-responsive">
        <table className="table table-borderless text-white-50">
          <thead className="fine-transparent-border-bottom">
            <tr>
              <th>Produto</th>
              <th>Referência</th>
              <th>Qtd.</th>
              <th>Valor Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(products || []).map(
              (item, index) =>
                item && (
                  <tr key={index} className="fine-transparent-border-bottom">
                    <td>
                      {(item.variacao &&
                        productNames[item.variacao.referencia_produto]) ||
                        "Carregando..."}
                    </td>
                    <td>{item.variacao?.referencia_produto}</td>
                    <td>{item.quantidade}</td>
                    <td>{formatCurrency(item.preco_unitario)}</td>
                    <td>
                      {formatCurrency(
                        item.quantidade * parseFloat(item.preco_unitario)
                      )}
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SaleSummary = ({ sale, subtotalProdutos }: SaleSummaryProps) => (
  <div className="p-3 text-white-50">
    <p>
      <strong>Subtotal Produtos:</strong> {formatCurrency(subtotalProdutos)}
    </p>
    <p>
      <strong>Desconto:</strong> {formatCurrency(sale.desconto)}
    </p>
    <p>
      <strong>Acréscimo:</strong> {formatCurrency(sale.acrescimo)}
    </p>
    <h5 className="text-right text-white">
      <strong>Valor Total:</strong> {formatCurrency(sale.total)}
    </h5>
  </div>
);

const ModalFooter = ({ onClose }: ModalFooterProps) => (
  <div className="d-flex justify-content-end p-3 fine-transparent-border-top">
    <button
      type="button"
      className="btn primaria mx-2 footerButton"
      onClick={onClose}
    >
      <i className="fas fa-times mr-1"></i>Fechar
    </button>
  </div>
);

const SalesDetail = ({ show, onClose, sale }: SalesDetailProps) => {
  if (!show || !sale) {
    return null;
  }

  const subtotalProdutos = (sale.itens || []).reduce((sum: number, item) => {
    if (!item) return sum;
    return sum + item.quantidade * parseFloat(item.preco_unitario);
  }, 0);

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div
          className="modal-content quinary small-shadow fine-transparent-border"
          style={{ borderRadius: "20px", color: "white" }}
        >
          <ModalHeader title={`Detalhes da Venda`} onClose={onClose} />

          <div className="modal-body p-0">
            <SaleInfo sale={sale} />
            <hr className="m-0 fine-transparent-border" />
            <ProductsTable products={sale.itens} />
            <hr className="m-0 fine-transparent-border" />
            <SaleSummary sale={sale} subtotalProdutos={subtotalProdutos} />
          </div>

          <ModalFooter onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default SalesDetail;
