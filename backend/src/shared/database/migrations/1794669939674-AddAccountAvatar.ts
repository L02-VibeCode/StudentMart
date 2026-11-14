import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountAvatar1794669939674 implements MigrationInterface {
    name = 'AddAccountAvatar1794669939674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "AvatarCleanup" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "account_id" uuid NOT NULL, "public_id" text NOT NULL, CONSTRAINT "PK_f7c4946f264903ea73fa684aa7b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Account" ADD "avatar_url" text`);
        await queryRunner.query(`ALTER TABLE "Account" ADD "avatar_public_id" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Account" DROP COLUMN "avatar_public_id"`);
        await queryRunner.query(`ALTER TABLE "Account" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`DROP TABLE "AvatarCleanup"`);
    }

}
