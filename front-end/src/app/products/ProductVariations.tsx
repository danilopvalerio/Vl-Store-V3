// products/ProductVariations.tsx
"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface Variation {
  id_variacao?: string;
  descricao: string;
  quantidade: number;
  valor: number | string;
}

interface ProductVariationsProps {
  referenciaProduto: string;
  userRole: "admin" | "employee";
  currentVariations: Variation[];
  setCurrentVariations: React.Dispatch<React.SetStateAction<Variation[]>>;
  originalVariations: Variation[];
  setOriginalVariations: React.Dispatch<React.SetStateAction<Variation[]>>;
  deletedVariationIds: string[];
  setDeletedVariationIds: React.Dispatch<React.SetStateAction<string[]>>;
  variationErrors: string[];
  setVariationErrors: React.Dispatch<React.SetStateAction<string[]>>;
}

const ProductVariations: React.FC<ProductVariationsProps> = ({
  referenciaProduto,
  userRole,
  currentVariations,
  setCurrentVariations,
  originalVariations,
  setOriginalVariations,
  deletedVariationIds,
  setDeletedVariationIds,
  variationErrors,
  setVariationErrors,
}) => {
  const [isLoadingVariations, setIsLoadingVariations] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchVariations(page, limit);
  }, [referenciaProduto, page, limit]);

  const fetchVariations = async (pageNum: number, limitNum: number) => {
    if (!referenciaProduto) return;
    setIsLoadingVariations(true);
    try {
      const response = await api.get(
        `/produtos/${referenciaProduto}/variacoes/paginated`,
        {
          params: { page: pageNum, limit: limitNum },
        }
      );
      const { data, totalPages: tp } = response.data;
      setCurrentVariations(data || []);
      setOriginalVariations(data || []);
      setTotalPages(tp || 1);
      setVariationErrors(new Array(data.length).fill(""));
    } catch (err) {
      console.error("Erro ao buscar variações:", err);
    } finally {
      setIsLoadingVariations(false);
    }
  };

  const handleVariationChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (userRole === "employee") return;
    const { name, value } = e.target;
    const updatedVariations = [...currentVariations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [name]: name === "descricao" ? value : parseFloat(value) || 0,
    };
    setCurrentVariations(updatedVariations);

    const errorsCopy = [...variationErrors];
    if (name === "descricao")
      errorsCopy[index] = !value.trim() ? "Descrição obrigatória" : "";
    else if (name === "valor")
      errorsCopy[index] =
        Number(value) <= 0 ? "Valor deve ser maior que 0" : "";
    setVariationErrors(errorsCopy);
  };

  const addVariation = () => {
    if (userRole === "employee") return;
    setCurrentVariations([
      ...currentVariations,
      { descricao: "", quantidade: 0, valor: 0 },
    ]);
    setVariationErrors([...variationErrors, "Descrição obrigatória"]);
  };

  const removeVariation = (index: number) => {
    if (userRole === "employee") return;
    const varToRemove = currentVariations[index];
    if (varToRemove.id_variacao)
      setDeletedVariationIds([...deletedVariationIds, varToRemove.id_variacao]);
    setCurrentVariations(currentVariations.filter((_, i) => i !== index));
    setVariationErrors(variationErrors.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>Variações</h5>
      </div>

      <div className="variations-container">
        {isLoadingVariations ? (
          <p>Carregando variações...</p>
        ) : currentVariations.length === 0 ? (
          <p className="text-muted">Nenhuma variação encontrada.</p>
        ) : (
          currentVariations.map((v, i) => (
            <div
              key={v.id_variacao || `new-${i}`}
              className="row g-2 align-items-center mb-2 p-2 rounded"
            >
              <div className="col-sm-5">
                <input
                  type="text"
                  name="descricao"
                  className={`w-100 p-2 border-input ${
                    variationErrors[i] ? "border-danger" : ""
                  }`}
                  value={v.descricao}
                  onChange={(e) => handleVariationChange(i, e)}
                  disabled={userRole === "employee"}
                />
              </div>
              <div className="col-sm-3">
                <input
                  type="number"
                  name="quantidade"
                  className="w-100 p-2 border-input"
                  value={v.quantidade}
                  min={0}
                  step={1}
                  onChange={(e) => handleVariationChange(i, e)}
                  disabled={userRole === "employee"}
                />
              </div>
              <div className="col-sm-3">
                <input
                  type="number"
                  name="valor"
                  className={`w-100 p-2 border-input ${
                    variationErrors[i] ? "border-danger" : ""
                  }`}
                  value={v.valor}
                  min={0}
                  onChange={(e) => handleVariationChange(i, e)}
                  disabled={userRole === "employee"}
                />
              </div>
              {userRole === "admin" && (
                <div className="col-sm-1 text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger rounded-5"
                    onClick={() => removeVariation(i)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {userRole === "admin" && (
        <div className="w-100 d-flex justify-content-center mb-4 mt-4">
          <button
            className="css-button-fully-rounded--white border-input ps-2 pe-2"
            onClick={addVariation}
          >
            Adicionar nova variação
          </button>
        </div>
      )}

      {currentVariations.length > 0 && (
        <div className="d-flex justify-content-center align-items-center mt-2 mb-3 gap-2">
          <button
            type="button"
            className="css-button-fully-rounded--white"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="css-button-fully-rounded--white"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductVariations;
