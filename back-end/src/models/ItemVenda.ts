import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import Venda from "./Venda";
import ProdutoVariacao from "./ProdutoVariacao";

@Entity("item_venda")
export default class ItemVenda {
  @PrimaryGeneratedColumn("uuid")
  id_item_venda!: string;

  @Column({ name: "id_venda", type: "uuid", nullable: false })
  idVenda!: string;

  @Column({ name: "id_variacao", type: "uuid", nullable: false })
  idVariacao!: string;

  @Column({ name: "quantidade_item", type: "integer", nullable: true })
  quantidade!: number;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Venda, (venda) => venda.itens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_venda" })
  venda!: Venda;

  @ManyToOne(() => ProdutoVariacao, (variacao) => variacao.itensVenda, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_variacao" })
  variacao!: ProdutoVariacao;
}
