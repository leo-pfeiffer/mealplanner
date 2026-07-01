import { DataTypes } from 'sequelize';
import type { MigrationContext } from './index';

export async function up({ context }: { context: MigrationContext }) {
    const { queryInterface, sequelize } = context;
    await sequelize.transaction(async (t) => {
        await queryInterface.createTable('google_oauth_tokens', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
            },
            accessToken: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            refreshToken: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            scope: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        }, { transaction: t });
    });
}

export async function down({ context }: { context: MigrationContext }) {
    const { queryInterface, sequelize } = context;
    await sequelize.transaction(async (t) => {
        await queryInterface.dropTable('google_oauth_tokens', { transaction: t });
    });
}
