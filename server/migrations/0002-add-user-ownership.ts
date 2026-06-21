import { DataTypes, QueryTypes } from 'sequelize';
import type { MigrationContext } from './index';

// sequelize.sync() ran on every dev-server restart for years without an
// explicit constraint name on `unique: true`, so Postgres accumulated one
// auto-named unique(name) constraint per restart instead of recognizing the
// existing one. Find and drop all of them rather than assuming a single
// well-known name.
async function dropAllUniqueConstraintsOnColumn(context: MigrationContext, table: string, column: string) {
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
        { replacements: { table, column }, type: QueryTypes.SELECT }
    );
    for (const row of rows) {
        await queryInterface.removeConstraint(table, row.conname);
    }
}

export async function up({ context }: { context: MigrationContext }) {
    const { queryInterface, sequelize } = context;

    await queryInterface.addColumn('recipes', 'userId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
    });
    await queryInterface.addColumn('mealplans', 'userId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
    });

    const appUser = process.env.APP_USER;
    if (!appUser) {
        throw new Error('Environment variable APP_USER must be set to backfill ownership of existing data');
    }
    const [defaultUser] = await sequelize.query<{ id: number }>(
        `SELECT id FROM users WHERE email = :appUser LIMIT 1`,
        { replacements: { appUser }, type: QueryTypes.SELECT }
    );
    if (!defaultUser) {
        throw new Error(`No user found with email matching APP_USER ("${appUser}") — run migration 0001 first`);
    }

    await sequelize.query(`UPDATE recipes SET "userId" = :userId`, { replacements: { userId: defaultUser.id } });
    await sequelize.query(`UPDATE mealplans SET "userId" = :userId`, { replacements: { userId: defaultUser.id } });

    await queryInterface.changeColumn('recipes', 'userId', { type: DataTypes.INTEGER, allowNull: false });
    await queryInterface.changeColumn('mealplans', 'userId', { type: DataTypes.INTEGER, allowNull: false });

    await dropAllUniqueConstraintsOnColumn(context, 'recipes', 'name');
    await dropAllUniqueConstraintsOnColumn(context, 'mealplans', 'name');

    await queryInterface.addConstraint('recipes', {
        fields: ['userId', 'name'],
        type: 'unique',
        name: 'recipes_user_id_name_unique',
    });
    await queryInterface.addConstraint('mealplans', {
        fields: ['userId', 'name'],
        type: 'unique',
        name: 'mealplans_user_id_name_unique',
    });
}

export async function down({ context }: { context: MigrationContext }) {
    const { queryInterface } = context;
    await queryInterface.removeConstraint('recipes', 'recipes_user_id_name_unique');
    await queryInterface.removeConstraint('mealplans', 'mealplans_user_id_name_unique');
    await queryInterface.removeColumn('recipes', 'userId');
    await queryInterface.removeColumn('mealplans', 'userId');
    await queryInterface.addConstraint('recipes', { fields: ['name'], type: 'unique', name: 'recipes_name_unique' });
    await queryInterface.addConstraint('mealplans', { fields: ['name'], type: 'unique', name: 'mealplans_name_unique' });
}
