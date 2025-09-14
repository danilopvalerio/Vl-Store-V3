import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import Funcionario from "./Funcionario";
import Produto from "./Produto";
import Caixa from "./Caixa";
import Venda from "./Venda";
import Movimentacao from "./Movimentacao";
import LogSistema from "./LogSistema";
import RefreshToken from "./RefreshToken";

@Entity("loja")
export default class Loja {
  @PrimaryGeneratedColumn("uuid")
  id_loja!: string;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({ type: "varchar", length: 255 })
  senha!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({
    name: "cpf_cnpj_proprietario_loja",
    type: "varchar",
    length: 20,
    unique: true,
  })
  cpfCnpjProprietarioLoja!: string;

  @Column({ name: "data_nasc_proprietario", type: "date" })
  dataNascProprietario!: Date;

  @Column({ type: "varchar", length: 20, unique: true })
  telefone!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @OneToMany(() => Funcionario, (funcionario: Funcionario) => funcionario.loja)
  funcionarios!: Funcionario[];

  @OneToMany(() => Produto, (produto: Produto) => produto.loja)
  produtos!: Produto[];

  @OneToMany(() => Caixa, (caixa: Caixa) => caixa.loja)
  caixas!: Caixa[];

  @OneToMany(() => Venda, (venda: Venda) => venda.loja)
  vendas!: Venda[];

  @OneToMany(
    () => Movimentacao,
    (movimentacao: Movimentacao) => movimentacao.loja
  )
  movimentacoes!: Movimentacao[];

  @OneToMany(() => LogSistema, (log: LogSistema) => log.loja)
  logs!: LogSistema[];

  @OneToMany(() => RefreshToken, (token: RefreshToken) => token.loja)
  refreshTokens!: RefreshToken[];
}
