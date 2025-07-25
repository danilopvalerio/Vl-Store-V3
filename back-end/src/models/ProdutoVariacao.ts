// ProdutoVariacao.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import Produto from "./Produto";
import ItemVenda from "./ItemVenda";

@Entity("produto_variacao")
export default class ProdutoVariacao {
  @PrimaryGeneratedColumn("uuid")
  id_variacao!: string;

  @Column({ name: "id_produto", type: "varchar", length: 100, nullable: false })
  idProduto!: string;

  @Column({ name: "descricao_variacao", type: "text", nullable: true })
  descricao!: string;

  @Column({ name: "quant_variacao", type: "integer", nullable: true })
  quantidade!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  valor!: number;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Produto, (produto) => produto.variacoes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_produto", referencedColumnName: "referencia" })
  produto!: Produto;

  @OneToMany(() => ItemVenda, (item) => item.variacao)
  itensVenda!: ItemVenda[];
}
