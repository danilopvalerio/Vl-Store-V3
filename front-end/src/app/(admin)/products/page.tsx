// src/app/products/page.tsx
"use client";

import { GenericEntityPage } from "@/components/common/GenericEntityPage";
import EntityCard from "@/components/common/EntityCard";
import AddProductModal from "@/features/products/AddProductModal";
import ProductDetailModal from "@/features/products/ProductDetailModal";
import { ProductEntity } from "@/features/products/types";
import { getImageUrl } from "@/utils/imageUrl";
import { faBoxOpen, faLayerGroup } from "@fortawesome/free-solid-svg-icons";

const sortOptions = [
  { value: "name_asc", label: "Nome (A-Z)" },
  { value: "price_asc", label: "Menor Preço" },
  { value: "stock_desc", label: "Maior Estoque" },
];

const ProductsPage = () => {
  return (
    <GenericEntityPage<ProductEntity>
      pageTitle="Gerenciar Produtos"
      pageSubtitle="Controle de estoque e variações"
      apiPath="/products"
      sortOptions={sortOptions}
      getId={(prod) => prod.id_produto}
      renderCard={(prod, onSelect) => (
        <EntityCard
          title={prod.nome}
          subtitle={prod.categoria}
          imageUrl={getImageUrl(prod.imagem_capa)}
          isActive={prod.ativo}
          onClick={() => onSelect(prod.id_produto)}
          details={[
            {
              icon: faLayerGroup,
              text: prod.qtd_variacoes ?? 0,
              label: "Variações",
            },
            {
              icon: faBoxOpen,
              text: prod.total_estoque ?? 0,
              label: "Estoque",
            },
            {
              text: `R$ ${prod.menor_valor?.toFixed(2) ?? "0.00"}`,
              label: "Preço",
            },
          ]}
        />
      )}
      renderAddModal={(onClose, onSuccess) => (
        <AddProductModal onClose={onClose} onSuccess={onSuccess} />
      )}
      renderDetailModal={(id, onClose, onSuccess) => (
        <ProductDetailModal
          productId={String(id)}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    />
  );
};

export default ProductsPage;
