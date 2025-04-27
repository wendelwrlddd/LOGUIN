const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");  // Importando bcryptjs
const authMiddleware = require("./middleware/auth");

const app = express();
app.use(express.json());
require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });
}

// Usando o pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // SSL obrigatório na Railway
  connectTimeout: 30000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de conexão ao iniciar
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ ERRO DE CONEXÃO:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao MySQL!');
  conn.release();
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Cadastro
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  pool.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados" });
    if (results.length > 0) return res.status(400).json({ error: "Usuário já existe!" });

    const hashedPassword = bcrypt.hashSync(password, 8);
    pool.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Erro ao registrar usuário" });

        const newUser = { id: result.insertId, name };
        const token = generateToken(newUser);
        res.json({ token, user: newUser });
      }
    );
  });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  pool.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados" });

    const user = results[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: "Credenciais inválidas" });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name } });
  });
});

// Dashboard: diário + marcados com conteúdo
app.get("/dashboard", authMiddleware, (req, res) => {
  const userId = req.userId;

  // Consulta todas as entradas do diário
  pool.query(
    "SELECT * FROM diary WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, diaryResults) => {
      if (err) {
        console.error("Erro ao consultar o diário:", err);
        return res.status(500).json({ error: "Erro ao recuperar diário" });
      }

      // Consulta entradas marcadas com join para obter conteúdo
      pool.query(
        `SELECT d.* 
         FROM diary d 
         JOIN estrela e ON e.diary_id = d.id 
         WHERE e.user_id = ? 
         ORDER BY d.created_at DESC`,
        [userId],
        (err, starredEntries) => {
          if (err) {
            console.error("Erro ao consultar mensagens marcadas:", err);
            return res.status(500).json({ error: "Erro ao recuperar mensagens marcadas" });
          }

          // Mapeia IDs marcados para flag no diário
          const starredIds = new Set(starredEntries.map(e => e.id));
          const diaryWithFlag = diaryResults.map(entry => ({
            ...entry,
            isStarred: starredIds.has(entry.id)
          }));

          res.json({
            diary: diaryWithFlag,
            starred: starredEntries
          });
        }
      );
    }
  );
});

// Toggle star
app.post("/toggle-star/:messageId", authMiddleware, (req, res) => {
  const userId = req.userId;
  const messageId = req.params.messageId;

  pool.query(
    "SELECT * FROM estrela WHERE user_id = ? AND diary_id = ?",
    [userId, messageId],
    (err, results) => {
      if (err) {
        console.error("Erro ao verificar estrela:", err);
        return res.status(500).json({ error: "Erro ao verificar estrela" });
      }

      if (results.length > 0) {
        // Remove estrela
        pool.query(
          "DELETE FROM estrela WHERE user_id = ? AND diary_id = ?",
          [userId, messageId],
          err => {
            if (err) {
              console.error("Erro ao remover estrela:", err);
              return res.status(500).json({ error: "Erro ao remover estrela" });
            }
            res.json({ message: "Estrela removida com sucesso" });
          }
        );
      } else {
        // Adiciona estrela
        pool.query(
          "INSERT INTO estrela (user_id, diary_id) VALUES (?, ?)",
          [userId, messageId],
          err => {
            if (err) {
              console.error("Erro ao adicionar estrela:", err);
              return res.status(500).json({ error: "Erro ao adicionar estrela" });
            }
            res.json({ message: "Estrela adicionada com sucesso" });
          }
        );
      }
    }
  );
});

// Adicionar entrada de diário
app.post("/add-diary", authMiddleware, (req, res) => {
  const { content } = req.body;
  pool.query(
    "INSERT INTO diary (user_id, content) VALUES (?, ?)",
    [req.userId, content],
    err => {
      if (err) return res.status(500).json({ error: "Erro ao adicionar entrada" });
      res.json({ message: "Entrada de diário adicionada!" });
    }
  );
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
