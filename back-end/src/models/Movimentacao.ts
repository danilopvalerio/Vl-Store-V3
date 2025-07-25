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
  descricao!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  tipo!: string; // Ex: 'SANGRIA', 'SUPRIMENTO'

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  valor!: number;

  @Column({ name: "id_caixa", type: "uuid", nullable: false })
  idCaixa!: string;

  @Column({ name: "id_venda", type: "uuid", nullable: true })
  idVenda!: string;

  @Column({ name: "id_loja", type: "uuid", nullable: false })
  idLoja!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Caixa, (caixa) => caixa.movimentacoes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_caixa" })
  caixa!: Caixa;

  @ManyToOne(() => Venda, (venda) => venda.movimentacoes, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "id_venda" })
  venda!: Venda;

  @ManyToOne(() => Loja, (loja) => loja.movimentacoes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;
}
