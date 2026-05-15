const { Sequelize } = require("sequelize");

const db = new Sequelize(
  process.env.DB_NAME || "gestion_empleados",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "root", 
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: 3306,
    dialect: "mysql",
    logging: false,
  },
);

module.exports = db;
