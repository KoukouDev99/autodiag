const path = require('path');
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  console.log('=== QUESTIONS POUR LE SYMPTOME 1 ("Ne démarre pas") ===');
  const [questions] = await conn.query('SELECT * FROM diagnostic_questions WHERE symptom_id = 1 ORDER BY id ASC');
  console.log('Total questions:', questions.length);

  for (const q of questions) {
    console.log(`Q${q.id} (step ${q.step || q.order_index || q.id}): ${q.question_text}`);
    const [options] = await conn.query('SELECT * FROM answer_options WHERE question_id = ? ORDER BY id ASC', [q.id]);
    for (const opt of options) {
      console.log(`   [Option ${opt.id}] ${opt.label}`);
    }
  }

  await conn.end();
}

main().catch(console.error);
