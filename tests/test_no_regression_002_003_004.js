const { execSync } = require('child_process');
const path = require('path');

function runTest(file) {
  console.log(`\n▶️ Exécution de ${file}...`);
  try {
    const stdout = execSync(`node ${file}`, {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log(stdout.trim());
    console.log(`✅ ${file} : SUCCÈS`);
  } catch (err) {
    console.error(`❌ ${file} : ÉCHEC`);
    console.error(err.stdout || err.message);
    throw err;
  }
}

async function testNoRegression() {
  console.log('================================================================');
  console.log('🧪 SUITE DE NON-RÉGRESSION GLOBALE (MIGRATIONS 002 à 008 + DoD)');
  console.log('================================================================');

  runTest('tests/test_migration_003_seed_integrity.js');
  runTest('tests/test_migration_004_autocomplete.js');
  runTest('tests/test_migration_007_phase3.js');
  runTest('tests/test_migration_008_engine_specs.js');
  runTest('tests/test_dod_validation_journey.js');

  console.log('\n================================================================');
  console.log('🎉 TOUS LES TESTS DE NON-RÉGRESSION SONT 100% VERTS');
  console.log('================================================================\n');
}

testNoRegression().catch(err => {
  console.error('\n❌ Échec de la suite de non-régression :', err.message);
  process.exit(1);
});
