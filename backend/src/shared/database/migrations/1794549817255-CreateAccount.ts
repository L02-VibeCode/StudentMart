import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAccount1794549817255 implements MigrationInterface {
    name = 'CreateAccount1794549817255'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."account_role" AS ENUM('MEMBER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "Account" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying(254) NOT NULL, "password_hash" text NOT NULL, "display_name" character varying(100) NOT NULL, "role" "public"."account_role" NOT NULL DEFAULT 'MEMBER', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_cc1420f32afa2392dfdb5003647" UNIQUE ("email"), CONSTRAINT "PK_bf68fd30f1adeede9c72a5cac09" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Account"`);
        await queryRunner.query(`DROP TYPE "public"."account_role"`);
    }

}
