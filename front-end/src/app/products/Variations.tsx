// components/Variations.tsx
import { useState } from "react";
import axios from "axios";

interface Variation {
  id_variacao?: string;
  descricao_variacao: string;
  quant_variacao: number;
  valor: number;
}

interface VariationsProps {
  variations: Variation[];
  id_loja: string;
  referencia: string;
  onVariationsChange: (updatedVariations: Variation[]) => void;
  setError: (error: string) => void;
}

const Variations = ({
  variations,
  id_loja,
  referencia,
  onVariationsChange,
  setError,
}: VariationsProps) => {
  const getAuthHeaders = () => {
    const jwtToken = localStorage.getItem("jwtToken");
    return {
      Authorization: `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    };
  };

  const handleVariationChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "quant_variacao" || name === "valor" ? Number(value) : value;

    const updatedVariations = [...variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [name]: newValue,
    };
    onVariationsChange(updatedVariations);

    const variation = updatedVariations[index];

    try {
      if (variation.id_variacao) {
        // Atualizar variação existente
        await axios.patch(
          `https://vl-store-v2.onrender.com/api/produtos/variacao/${variation.id_variacao}`,
          { [name]: newValue },
          { headers: getAuthHeaders() }
        );
      } else {
        // Criar nova variação
        const response = await axios.post(
          `https://vl-store-v2.onrender.com/api/produtos/variacao/loja/${id_loja}/referencia/${referencia}`,
          variation,
          { headers: getAuthHeaders() }
        );

        // Atualiza o ID da variação no estado
        updatedVariations[index].id_variacao = response.data.data.id_variacao;
        onVariationsChange(updatedVariations);
      }
    } catch (err) {
      console.error("Erro ao atualizar variação:", err);
      setError("Erro ao atualizar variação");
      setTimeout(() => setError(""), 3000);
    }
  };

  const addVariation = () => {
    onVariationsChange([
      ...variations,
      { descricao_variacao: "", quant_variacao: 0, valor: 0 },
    ]);
  };

  const removeVariation = async (index: number) => {
    if (variations.length <= 1) return;

    const variationToRemove = variations[index];
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    onVariationsChange(updatedVariations);

    if (variationToRemove.id_variacao) {
      try {
        await axios.delete(
          `https://vl-store-v2.onrender.com/api/produtos/variacao/${variationToRemove.id_variacao}`,
          { headers: getAuthHeaders() }
        );
      } catch (err) {
        console.error("Erro ao remover variação:", err);
        setError("Erro ao remover variação");
        setTimeout(() => setError(""), 3000);
        // Reverte a remoção se der erro
        onVariationsChange(variations);
      }
    }
  };

  return (
    <div className="col-12 w-100">
      <h5 className="text-center mb-4">Variações*:</h5>

      {variations.map((variation, index) => (
        <article
          key={index}
          className="p-1 mx-auto variacao row align-items-center pb-4 justify-content-evenly mb-2 w-100"
        >
          <div className="col-12 col-md-6">
            <p className="col-12 mt-2 text-center">Descrição*</p>
            <input
              type="text"
              className="col-12 produto-input"
              placeholder="Ex: Tamanho GG - Azul"
              name="descricao_variacao"
              value={variation.descricao_variacao}
              onChange={(e) => handleVariationChange(index, e)}
            />
          </div>

          <div className="col-6 col-md-2">
            <p className="col-12 m-2 text-center">Quantidade*</p>
            <input
              type="number"
              className="col-12 produto-input"
              placeholder="Ex: 10"
              name="quant_variacao"
              value={variation.quant_variacao || ""}
              onChange={(e) => handleVariationChange(index, e)}
              min="0"
            />
          </div>

          <div className="col-6 col-md-2">
            <p className="col-12 m-2 text-center">Valor* (R$)</p>
            <input
              type="number"
              className="col-12 produto-input"
              placeholder="Ex: 79.90"
              name="valor"
              step="0.01"
              value={variation.valor || ""}
              onChange={(e) => handleVariationChange(index, e)}
              min="0"
            />
          </div>

          <button
            type="button"
            className="col-12 col-md-1 mt-4 btn-delete rounded-5"
            onClick={() => removeVariation(index)}
            disabled={variations.length <= 1}
          >
            X
          </button>
        </article>
      ))}

      <button
        type="button"
        className="down-btn btn col-12 col-md-3 primaria"
        onClick={addVariation}
      >
        Adicionar Variação
      </button>
    </div>
  );
};

export default Variations;
