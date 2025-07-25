import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import Loja from "./Loja";
import ProdutoVariacao from "./ProdutoVariacao";

@Entity("produto")
export default class Produto {
  @PrimaryColumn({ type: "varchar", length: 100 })
  referencia!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  nome!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  categoria!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  material!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  genero!: string;

  @Column({ name: "id_loja", type: "uuid", nullable: false })
  idLoja!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Loja, (loja) => loja.produtos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(() => ProdutoVariacao, (variacao) => variacao.produto)
  variacoes!: ProdutoVariacao[];
}
