import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthSessions1794622765393 implements MigrationInterface {
    name = 'AddAuthSessions1794622765393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "AuthSession" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "account_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_76c2485cc42b6c9de4704b87794" UNIQUE ("token_hash"), CONSTRAINT "CHK_AuthSession_revocation" CHECK ("revoked_at" IS NULL OR "revoked_at" >= "created_at"), CONSTRAINT "CHK_AuthSession_expiry" CHECK ("expires_at" > "created_at"), CONSTRAINT "PK_6d4f9fb96574cc239f1128512e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_AuthSession_account" ON "AuthSession" ("account_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_AuthSession_expiry" ON "AuthSession" ("expires_at") `);
        await queryRunner.query(`ALTER TABLE "Account" ADD "login_disabled_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "AuthSession" ADD CONSTRAINT "FK_1c47287ade6bbc342166a5e7d86" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "AuthSession" DROP CONSTRAINT "FK_1c47287ade6bbc342166a5e7d86"`);
        await queryRunner.query(`ALTER TABLE "Account" DROP COLUMN "login_disabled_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_AuthSession_expiry"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_AuthSession_account"`);
        await queryRunner.query(`DROP TABLE "AuthSession"`);
    }

}
