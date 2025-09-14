import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import Loja from "./Loja";
import ProdutoVariacao from "./ProdutoVariacao";

@Entity("produto")
export default class Produto {
  @PrimaryColumn({ type: "varchar", length: 100 })
  referencia!: string;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({ type: "varchar", length: 100 })
  categoria!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  material!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  genero!: string;

  @Column({ name: "id_loja", type: "uuid" })
  idLoja!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Loja, (loja: Loja) => loja.produtos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(
    () => ProdutoVariacao,
    (variacao: ProdutoVariacao) => variacao.produto
  )
  variacoes!: ProdutoVariacao[];
}
