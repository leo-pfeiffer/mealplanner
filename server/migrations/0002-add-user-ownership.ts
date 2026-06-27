import { DataTypes, QueryTypes, type Transaction } from 'sequelize';
import type { MigrationContext } from './index';

async function dropAllUniqueConstraintsOnColumn(
    context: MigrationContext,
    table: string,
    column: string,
    transaction: Transaction,
) {
    const { sequelize, queryInterface } = context;
    const rows = await sequelize.query<{ conname: string }>(
        `SELECT con.conname
         FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
         WHERE rel.relname = :table
           AND con.contype = 'u'
           AND att.attname = :column
           AND array_length(con.conkey, 1) = 1`,
        { replacements: { table, column }, type: QueryTypes.SELECT, transaction },
    );
    for (const row of rows) {
        await queryInterface.removeConstraint(table, row.conname, { transaction });
    }
}

export async function up({ context }: { context: MigrationContext }) {
    const { queryInterface, sequelize } = context;

    // Wrap everything in a single transaction. Postgres supports transactional
    // DDL, so any failure at any step rolls the entire migration back — the DB
    // is left exactly as it was before the migration started.
    await sequelize.transaction(async (t) => {
        await queryInterface.addColumn('recipes', 'userId', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        }, { transaction: t });

        await queryInterface.addColumn('mealplans', 'userId', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        }, { transaction: t });

        const appUser = process.env.APP_USER;
        if (!appUser) {
            throw new Error('Environment variable APP_USER must be set to backfill ownership of existing data');
        }
        const [defaultUser] = await sequelize.query<{ id: number }>(
            `SELECT id FROM users WHERE email = :appUser LIMIT 1`,
            { replacements: { appUser }, type: QueryTypes.SELECT, transaction: t },
        );
        if (!defaultUser) {
            throw new Error(`No user found with email matching APP_USER ("${appUser}") — run migration 0001 first`);
        }

        await sequelize.query(
            `UPDATE recipes SET "userId" = :userId`,
            { replacements: { userId: defaultUser.id }, transaction: t },
        );
        await sequelize.query(
            `UPDATE mealplans SET "userId" = :userId`,
            { replacements: { userId: defaultUser.id }, transaction: t },
        );

        await queryInterface.changeColumn('recipes', 'userId', { type: DataTypes.INTEGER, allowNull: false }, { transaction: t });
        await queryInterface.changeColumn('mealplans', 'userId', { type: DataTypes.INTEGER, allowNull: false }, { transaction: t });

        await dropAllUniqueConstraintsOnColumn(context, 'recipes', 'name', t);
        await dropAllUniqueConstraintsOnColumn(context, 'mealplans', 'name', t);

        await queryInterface.addConstraint('recipes', {
            fields: ['userId', 'name'],
            type: 'unique',
            name: 'recipes_user_id_name_unique',
            transaction: t,
        });
        await queryInterface.addConstraint('mealplans', {
            fields: ['userId', 'name'],
            type: 'unique',
            name: 'mealplans_user_id_name_unique',
            transaction: t,
        });
    });
}

export async function down({ context }: { context: MigrationContext }) {
    const { queryInterface, sequelize } = context;
    await sequelize.transaction(async (t) => {
        await queryInterface.removeConstraint('recipes', 'recipes_user_id_name_unique', { transaction: t });
        await queryInterface.removeConstraint('mealplans', 'mealplans_user_id_name_unique', { transaction: t });
        await queryInterface.removeColumn('recipes', 'userId', { transaction: t });
        await queryInterface.removeColumn('mealplans', 'userId', { transaction: t });
        await queryInterface.addConstraint('recipes', { fields: ['name'], type: 'unique', name: 'recipes_name_unique', transaction: t });
        await queryInterface.addConstraint('mealplans', { fields: ['name'], type: 'unique', name: 'mealplans_name_unique', transaction: t });
    });
}
