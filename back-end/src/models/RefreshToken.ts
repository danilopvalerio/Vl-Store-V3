import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import Loja from "./Loja";

@Entity("refresh_token")
export default class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  hashedToken!: string;

  @Column({ name: "id_loja", type: "uuid" })
  id_loja!: string;

  @ManyToOne(() => Loja, (loja: Loja) => loja.refreshTokens, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;
}
