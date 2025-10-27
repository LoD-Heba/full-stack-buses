import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveEmailPhoneToProfile1234567890123 implements MigrationInterface {
    name = 'MoveEmailPhoneToProfile1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Agregar columna email a user_profiles
        await queryRunner.query(`
            ALTER TABLE "user_profiles" 
            ADD COLUMN "email" VARCHAR(100) NULL
        `);

        // 2. Crear índice único para email en user_profiles (solo si no es null)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_user_profiles_email" 
            ON "user_profiles" ("email") 
            WHERE "email" IS NOT NULL
        `);

        // 3. Modificar columna phone en user_profiles para que sea unique
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_user_profiles_phone" 
            ON "user_profiles" ("phone") 
            WHERE "phone" IS NOT NULL
        `);

        // 4. Migrar datos: copiar email y phone de users a user_profiles
        // Solo para usuarios que tienen un perfil asociado
        await queryRunner.query(`
            UPDATE "user_profiles" up
            SET 
                "email" = u.email,
                "phone" = u.phone
            FROM "users" u
            WHERE u.profile_id = up.id
            AND u.email IS NOT NULL
        `);

        // 5. Eliminar índices únicos de email y phone en users
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be"
        `); // índice de email

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_a000cca60bcf04454e72769949"
        `); // índice de phone

        // 6. Eliminar columnas email y phone de users
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "email"
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "phone"
        `);

        // 7. Eliminar columnas de verificación si existen
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "is_email_verified"
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "is_phone_verified"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Restaurar columnas en users
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "email" VARCHAR(100) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "phone" VARCHAR(20) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "is_email_verified" BOOLEAN DEFAULT FALSE
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "is_phone_verified" BOOLEAN DEFAULT FALSE
        `);

        // 2. Migrar datos de vuelta
        await queryRunner.query(`
            UPDATE "users" u
            SET 
                "email" = up.email,
                "phone" = up.phone
            FROM "user_profiles" up
            WHERE u.profile_id = up.id
        `);

        // 3. Restaurar índices únicos en users
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" 
            ON "users" ("email") 
            WHERE "email" IS NOT NULL
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a000cca60bcf04454e72769949" 
            ON "users" ("phone") 
            WHERE "phone" IS NOT NULL
        `);

        // 4. Eliminar email de user_profiles
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_user_profiles_email"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_user_profiles_phone"
        `);

        await queryRunner.query(`
            ALTER TABLE "user_profiles" 
            DROP COLUMN "email"
        `);
    }
}