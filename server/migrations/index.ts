import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../dao/models';

// Context handed to every migration's up({ context })/down({ context }).
// `context.queryInterface` gives raw DDL access; `context.sequelize` is
// available for DataTypes / Sequelize.fn / literal helpers.
export interface MigrationContext {
    queryInterface: ReturnType<typeof sequelize.getQueryInterface>;
    sequelize: typeof sequelize;
}

export const umzug = new Umzug<MigrationContext>({
    migrations: {
        glob: ['server/migrations/[0-9]*.ts', { cwd: process.cwd() }],
    },
    context: {
        queryInterface: sequelize.getQueryInterface(),
        sequelize,
    },
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

export type Migration = typeof umzug._types.migration;
