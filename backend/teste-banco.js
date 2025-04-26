const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'yamanote.proxy.rlwy.net',
  port: 15617,
  user: 'root',
  password: 'NpVVMUUgrciTVngvfYLQayMVzCjAnPJg',
  database: 'railway',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 10000
});

pool.getConnection((err, conn) => {
  if (err) {
    console.log('❌ ERRO DE CONEXÃO:', err.message);
    process.exit(1);
  }
  console.log('✅ CONECTOU! Tudo certo nas credenciais.');
  conn.release();
  process.exit(0);
});