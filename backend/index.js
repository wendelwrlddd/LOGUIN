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


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Substitua pela senha do banco
  database: process.env.DB_DATABASE
});

connection.connect((err) => {
  if (err) {
    console.error('Erro de conexão: ' + err.stack);
    return;
  }
  console.log('Conectado ao banco de dados com ID ' + connection.threadId);
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Gerar token
function generateToken(user) {
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });
}

// Cadastro
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  // Verifica se o usuário já existe
  connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados" });

    if (results.length > 0) {
      return res.status(400).json({ error: "Usuário já existe!" });
    }

    // Criptografar a senha
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Inserir novo usuário
    connection.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
      [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: "Erro ao registrar usuário" });

      const newUser = { id: result.insertId, name };
      const token = generateToken(newUser);
      res.json({ token, user: newUser });
    });
  });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Verifica se o usuário existe
  connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados" });

    const user = results[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: "Credenciais inválidas" });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name } });
  });
});

// Mini diário
app.get("/dashboard", authMiddleware, (req, res) => {
  connection.query("SELECT * FROM users WHERE id = ?", [req.userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no banco de dados" });

    const user = results[0];
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    connection.query("SELECT * FROM diary WHERE user_id = ?", [user.id], (err, diaryResults) => {
      if (err) return res.status(500).json({ error: "Erro ao recuperar diário" });
      res.json({ message: `Bem-vindo, ${user.name}`, diary: diaryResults });
    });
  });
});

// Adicionar diário
app.post("/add-diary", authMiddleware, (req, res) => {
  const { content } = req.body;

  connection.query("INSERT INTO diary (user_id, content) VALUES (?, ?)", [req.userId, content], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao adicionar entrada" });
    res.json({ message: "Entrada de diário adicionada!" });
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
