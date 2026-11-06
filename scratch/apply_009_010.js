const fs = require('fs');
const path = require('path');
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev',
    multipleStatements: true
  });

  console.log('Applying 009_ai_audit_log.sql...');
  const sql009 = fs.readFileSync('db/migrations/009_ai_audit_log.sql', 'utf8');
  await conn.query(sql009);
  console.log('009_ai_audit_log.sql applied successfully.');

  console.log('Applying 010_safety_rules.sql...');
  const sql010 = fs.readFileSync('db/migrations/010_safety_rules.sql', 'utf8');
  await conn.query(sql010);
  console.log('010_safety_rules.sql applied successfully.');

  const [t1] = await conn.query("SHOW TABLES LIKE 'ai_audit_log'");
  const [t2] = await conn.query("SHOW TABLES LIKE 'safety_rules'");
  const [sRules] = await conn.query("SELECT COUNT(*) as count FROM safety_rules");

  console.log('Verification:');
  console.log({
    ai_audit_log_table: t1.length > 0,
    safety_rules_table: t2.length > 0,
    safety_rules_seeded: sRules[0].count
  });

  await conn.end();
})();
