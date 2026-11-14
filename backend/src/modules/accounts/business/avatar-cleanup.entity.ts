import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
// Durable provider cleanup intent; survives unlink/replace and account deletion.
@Entity({ name: "AvatarCleanup" })
export class AvatarCleanup {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "account_id", type: "uuid" }) accountId!: string;
  @Column({ name: "public_id", type: "text" }) publicId!: string;
}
