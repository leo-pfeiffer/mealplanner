import bcrypt from 'bcrypt';
import { DataTypes } from 'sequelize';
import type { MigrationContext } from './index';

const SALT_ROUNDS = 10;

export async function up({ context }: { context: MigrationContext }) {
    const { queryInterface } = context;
    await queryInterface.createTable('users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        notificationEmail: {
            type: DataTypes.STRING,
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
    });

    await queryInterface.createTable('sessions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        tokenHash: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    });

    const { APP_USER, APP_PASSWORD } = process.env;
    if (!APP_USER || !APP_PASSWORD) {
        throw new Error('Environment variables APP_USER and APP_PASSWORD must be set to create the default user');
    }

    const passwordHash = await bcrypt.hash(APP_PASSWORD, SALT_ROUNDS);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
        {
            email: APP_USER,
            passwordHash,
            notificationEmail: null,
            createdAt: now,
            updatedAt: now,
        },
    ]);
}

export async function down({ context }: { context: MigrationContext }) {
    const { queryInterface } = context;
    await queryInterface.dropTable('sessions');
    await queryInterface.dropTable('users');
}
