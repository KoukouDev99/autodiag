const path = require('path');
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  await conn.query(`
    INSERT INTO vehicles (id, user_id, brand, model, year, fuel, engine, mileage, is_primary)
    VALUES (25, 1, 'Peugeot', '208', 2020, 'Essence', '1.2 PureTech', 45000, 1)
    ON DUPLICATE KEY UPDATE id=id
  `);

  const [rows] = await conn.query('SELECT * FROM vehicles WHERE id = 25');
  console.log('Vehicle 25:', rows);

  await conn.end();
})();
