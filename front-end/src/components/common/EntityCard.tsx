// src/components/common/EntityCard.tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

interface CardDetail {
  icon?: IconDefinition;
  text: string | number;
  label?: string; // para tooltip
}

interface EntityCardProps {
  title: string;
  subtitle?: string; // ex: Categoria ou Referencia
  imageUrl?: string | null;
  isActive?: boolean;
  details: CardDetail[]; // Array para o rodapé (Preço, Estoque, etc)
  onClick: () => void;
}

const EntityCard = ({
  title,
  subtitle,
  imageUrl,
  isActive = true,
  details,
  onClick,
}: EntityCardProps) => {
  return (
    <div
      className="card-item-bottom-line-rounded h-100 hover-shadow cursor-pointer overflow-hidden d-flex flex-column bg-white border rounded"
      onClick={onClick}
      style={{ transition: "transform 0.2s", opacity: isActive ? 1 : 0.6 }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-2px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {/* Área da Imagem (Opcional) */}
      <div
        className="w-100 bg-light d-flex align-items-center justify-content-center border-bottom"
        style={{ height: "150px", position: "relative" }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            style={{ objectFit: "cover" }}
            sizes="300px"
          />
        ) : (
          <div className="text-secondary text-opacity-25">
            {/* Você pode passar um ícone padrão por prop se quiser variar entre User/Box */}
            <FontAwesomeIcon icon={faImage} size="3x" />
          </div>
        )}
        {!isActive && (
          <div className="position-absolute top-0 end-0 m-2">
            <span className="badge bg-danger shadow-sm">INATIVO</span>
          </div>
        )}
      </div>

      <div className="card-body p-3 d-flex flex-column flex-grow-1">
        <div className="mb-2">
          <h6 className="card-title fw-bold mb-1 text-truncate" title={title}>
            {title}
          </h6>
          {subtitle && (
            <span
              className="badge bg-light text-secondary border text-truncate"
              style={{ maxWidth: "100%" }}
            >
              {subtitle}
            </span>
          )}
        </div>

        {/* Rodapé Dinâmico */}
        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2 text-muted small">
          {details.map((detail, index) => (
            <div
              key={index}
              className="d-flex align-items-center"
              title={detail.label}
            >
              {detail.icon && (
                <FontAwesomeIcon icon={detail.icon} className="me-1" />
              )}
              <span>{detail.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EntityCard;
