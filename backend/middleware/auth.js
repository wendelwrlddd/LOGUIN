const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Token ausente');
    return res.status(401).json({ error: "Token ausente" });
  }

  const [, token] = authHeader.split(" ");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Corrigido para usar o valor da variável de ambiente
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.log('Token inválido', err);  // Adicionado log de erro
    res.status(401).json({ error: "Token inválido" });
  }
};
