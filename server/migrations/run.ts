import { umzug } from './index';

async function main() {
    const executed = await umzug.up();

    if (executed.length === 0) {
        console.log('No pending migrations. Database is up to date.');
    } else {
        console.log(`Executed ${executed.length} migration(s):`);
        for (const migration of executed) {
            console.log(`  - ${migration.name}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
