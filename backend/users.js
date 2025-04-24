const bcrypt = require("./node_modules/bcryptjs/umd");

const users = [
  {
    id: 1,
    name: "Wendel",
    email: "wendel@email.com",
    password: bcrypt.hashSync("123456", 10), // senha criptografada
  },
];

module.exports = users;
