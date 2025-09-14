import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import Caixa from "./Caixa";
import Venda from "./Venda";
import Loja from "./Loja";

@Entity("movimentacao")
export default class Movimentacao {
  @PrimaryGeneratedColumn("uuid")
  id_movimentacao!: string;

  @Column({ type: "text", nullable: true })
  descricao!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  tipo!: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  valor!: number | null;

  @Column({ name: "id_caixa", type: "uuid" })
  idCaixa!: string;

  @Column({ name: "id_venda", type: "uuid", nullable: true })
  idVenda!: string | null;

  @Column({ name: "id_loja", type: "uuid" })
  idLoja!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Caixa, (caixa: Caixa) => caixa.movimentacoes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_caixa" })
  caixa!: Caixa;

  @ManyToOne(() => Venda, (venda: Venda) => venda.movimentacoes, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "id_venda" })
  venda!: Venda | null;

  @ManyToOne(() => Loja, (loja: Loja) => loja.movimentacoes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;
}
