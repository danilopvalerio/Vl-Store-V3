// InfoCard.tsx
import React from "react";
// Importa os estilos CSS Modules
import styles from "./../../styles/InforCard.module.css";

// Interface de Props: define o que o componente "espera" receber
interface InfoCardProps {
  title: string;
  value: string | number;
  /**
   * O ícone a ser exibido.
   * React.ReactNode aceita:
   * - JSX (<FontAwesomeIcon icon={...} />)
   * - String ("🛒")
   * - Número (5)
   * - null, undefined, boolean
   */
  icon: string;
  // Opcional: para mudar a cor da borda
  borderColor?: string;
}

/**
 * Componente reutilizável para exibir um indicador (KPI)
 * em um card de dashboard.
 */
const InfoCard = ({ title, value, icon, borderColor }: InfoCardProps) => {
  // Define o estilo da borda. Usa a cor recebida ou um padrão (magenta).
  const cardStyle = {
    borderTopColor: borderColor || "#F000FF",
  };

  return (
    // Aplica a classe principal do CSS Module e o estilo da borda
    <div className={styles.card} style={cardStyle}>
      <div className={styles.textWrapper}>
        {icon} {title}
      </div>

      <span className={styles.value}>{value}</span>
    </div>
  );
};

export default InfoCard;
