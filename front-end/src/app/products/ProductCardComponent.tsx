"use client";

// Nenhum import de 'useRouter' ou 'axios' é mais necessário aqui.

// A interface pode ser simplificada para conter apenas o que o card exibe.
export interface ProductSummary {
  referencia: string;
  nome: string;
  categoria: string;
  material: string;
}

// A interface de props agora declara a função 'onClick' que será recebida.
interface ProductCardProps {
  product: ProductSummary;
  onClick: (referencia: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  // Toda a lógica interna foi removida.
  // O componente agora só recebe props e renderiza a UI.
  return (
    // A classe da coluna foi ajustada para um layout de grid mais consistente.
    <div
      className="rounded-5 card-item css-button-fully-rounded--white h-100 d-flex flex-column justify-content-between p-3 "
      // Ao clicar, ele chama a função 'onClick' que foi passada pelo componente pai.
      onClick={() => onClick(product.referencia)}
      style={{ cursor: "pointer" }}
    >
      <div>
        <h5 className="card-title mb-3">{product.nome}</h5>
        <p className="mb-1">
          <strong>
            Referência
            <br />
          </strong>{" "}
          {product.referencia}
        </p>
        <p className="mb-1">
          <strong>
            Categoria
            <br />
          </strong>{" "}
          {product.categoria}
        </p>
        <p className="mb-3">
          <strong>
            Material
            <br />
          </strong>{" "}
          {product.material}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
