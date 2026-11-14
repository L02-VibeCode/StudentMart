import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "../../accounts/business/account.entity";

@Entity({ name: "AuthSession" })
@Check("CHK_AuthSession_expiry", '"expires_at" > "created_at"')
@Check("CHK_AuthSession_revocation", '"revoked_at" IS NULL OR "revoked_at" >= "created_at"')
export class AuthSession {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index("IDX_AuthSession_account")
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @ManyToOne(() => Account, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "account_id" }) account!: Account;
  @Column({ name: "token_hash", type: "char", length: 64, unique: true, select: false }) tokenHash!: string;
  @Column({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @Index("IDX_AuthSession_expiry")
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null;
}
