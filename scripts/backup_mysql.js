/**
 * Automated MySQL Backup & Restore Verification Script - AutoDiag
 * Production DevOps Tooling
 *
 * Utilisation :
 *   node scripts/backup_mysql.js             -> Génère une sauvegarde complète dans ./backups
 *   node scripts/backup_mysql.js --test-restore -> Génère un backup ET teste sa restauration
 */

const path = require('path');
const fs = require('fs');

// Résolution des modules backend
const backendModules = path.resolve(__dirname, '../backend/node_modules');
module.paths.unshift(backendModules);

require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');

const BACKUP_DIR = path.resolve(__dirname, '../backups');

async function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `autodiag_backup_${timestamp}.sql`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  console.log('================================================================');
  console.log(`📦 DÉMARRAGE DU BACKUP MYSQL : ${process.env.DB_NAME || 'autodiag_dev'}`);
  console.log(`📁 Fichier cible : ${backupFilePath}`);
  console.log('================================================================');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'autodiag_dev',
    multipleStatements: true
  });

  const writeStream = fs.createWriteStream(backupFilePath, { encoding: 'utf8' });

  // Header SQL
  writeStream.write(`-- ========================================================\n`);
  writeStream.write(`-- AutoDiag Automated Database Backup\n`);
  writeStream.write(`-- Date : ${new Date().toISOString()}\n`);
  writeStream.write(`-- Database : ${process.env.DB_NAME || 'autodiag_dev'}\n`);
  writeStream.write(`-- ========================================================\n\n`);
  writeStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
  writeStream.write(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`);
  writeStream.write(`SET NAMES utf8mb4;\n\n`);

  // Liste des tables
  const [tablesResult] = await connection.query('SHOW TABLES');
  const tableKey = Object.keys(tablesResult[0])[0];
  const tables = tablesResult.map(row => row[tableKey]);

  let totalRowsDumped = 0;

  for (const table of tables) {
    // 1. Structure de la table
    writeStream.write(`-- --------------------------------------------------------\n`);
    writeStream.write(`-- Structure de la table \`${table}\`\n`);
    writeStream.write(`-- --------------------------------------------------------\n`);
    writeStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);

    const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
    writeStream.write(`${createTableResult[0]['Create Table']};\n\n`);

    // 2. Données de la table (Insertions multiples groupées pour rapidité et compacité)
    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      writeStream.write(`-- Données de la table \`${table}\` (${rows.length} lignes)\n`);
      const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      const CHUNK_SIZE = 150;

      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const valuesList = chunk.map(row => {
          const rowVals = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (val instanceof Date) return connection.escape(val.toISOString().slice(0, 19).replace('T', ' '));
            if (typeof val === 'object') return connection.escape(JSON.stringify(val));
            return connection.escape(val);
          }).join(', ');
          return `(${rowVals})`;
        }).join(',\n  ');

        writeStream.write(`INSERT INTO \`${table}\` (${columns}) VALUES\n  ${valuesList};\n`);
      }
      writeStream.write(`\n`);
      totalRowsDumped += rows.length;
    }
  }

  writeStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  writeStream.write(`-- Fin du backup AutoDiag\n`);

  await new Promise(resolve => writeStream.end(resolve));
  await connection.end();

  const stats = fs.statSync(backupFilePath);
  const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`✓ Backup généré avec succès : ${tables.length} tables, ${totalRowsDumped} enregistrements (${sizeMb} Mo)`);

  return { backupFilePath, tableCount: tables.length, rowCount: totalRowsDumped };
}

async function testRestore(backupFilePath, originalTableCount) {
  const readline = require('readline');
  const TEST_DB = 'autodiag_test_restore';
  console.log('\n================================================================');
  console.log(`🧪 TEST DE RESTAURATION SUR LA BASE VIRTUELLE : \`${TEST_DB}\``);
  console.log('================================================================');

  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    // 1. Recréer la base de test
    await rootConn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\`; CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`  ✓ Base de test créée : \`${TEST_DB}\``);

    // 2. Importer le fichier SQL ligne par ligne / commande par commande pour respecter max_allowed_packet
    const testDbConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: TEST_DB,
      multipleStatements: true
    });

    const fileStream = fs.createReadStream(backupFilePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let currentBatch = '';
    let batchStatements = 0;
    let totalExecuted = 0;

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
        continue;
      }
      currentBatch += line + '\n';
      if (trimmed.endsWith(';')) {
        batchStatements++;
        // Exécuter par lot de 250 instructions ou 256 Ko pour une performance maximale tout en respectant max_allowed_packet
        if (batchStatements >= 250 || currentBatch.length > 256 * 1024) {
          await testDbConn.query(currentBatch);
          totalExecuted += batchStatements;
          currentBatch = '';
          batchStatements = 0;
        }
      }
    }

    if (currentBatch.trim()) {
      await testDbConn.query(currentBatch);
      totalExecuted += batchStatements;
    }

    console.log(`  ✓ ${totalExecuted} instructions SQL exécutées avec succès dans \`${TEST_DB}\``);

    // 3. Vérification de cohérence
    const [restoredTables] = await testDbConn.query('SHOW TABLES');
    const restoredCount = restoredTables.length;
    console.log(`  ✓ Nombre de tables restaurées : ${restoredCount} (attendu: ${originalTableCount})`);

    if (restoredCount !== originalTableCount) {
      throw new Error(`Incohérence : ${restoredCount} tables au lieu de ${originalTableCount}`);
    }

    // 4. Nettoyage de la base de test
    await testDbConn.end();
    await rootConn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\`;`);
    console.log(`  ✓ Base temporaire supprimée proprement.`);
    console.log('🎉 VALIDATION COMPLÈTE DE LA RESTAURATION : 100% SUCCÈS');
  } catch (err) {
    console.error(`  ✗ Échec de la restauration test : ${err.message}`);
    throw err;
  } finally {
    await rootConn.end();
  }
}

async function main() {
  const isTestRestore = process.argv.includes('--test-restore');
  const { backupFilePath, tableCount } = await createBackup();

  if (isTestRestore) {
    await testRestore(backupFilePath, tableCount);
  }
}

main().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
