const { initDatabase, getPool } = require('../backend/src/db/db');
const fs = require('fs');

async function check() {
  await initDatabase();
  const pool = getPool();
  const content = fs.readFileSync('frontend/src/app/services/db-translations.data.ts', 'utf8');

  const [questions] = await pool.query('SELECT id, symptom_id, title, description, why_ask, reformulation, test_action FROM diagnostic_questions WHERE symptom_id <= 9');
  console.log(`Diagnostic questions (symptom <= 9): ${questions.length}`);
  let qMissing = 0;
  for (const q of questions) {
    if (!content.includes(q.title)) {
      console.log('Missing Q Title:', q.id, q.title);
      qMissing++;
    }
  }

  const [options] = await pool.query('SELECT ao.id, ao.label, ao.subtitle FROM answer_options ao JOIN diagnostic_questions dq ON ao.question_id = dq.id WHERE dq.symptom_id <= 9');
  console.log(`Answer options (symptom <= 9): ${options.length}`);
  let optMissing = 0;
  for (const opt of options) {
    if (!content.includes(opt.label)) {
      console.log('Missing Opt Label:', opt.id, opt.label);
      optMissing++;
    }
    if (opt.subtitle && !content.includes(opt.subtitle)) {
      console.log('Missing Opt Subtitle:', opt.id, opt.subtitle);
      optMissing++;
    }
  }
  process.exit(0);
}

check();

