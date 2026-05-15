const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const db = require("../database/connection");
const employeeRoutes = require("../routes/employeeRoutes");
const authRoutes = require("../routes/authRoutes");
const payrollRoutes = require("../routes/payrollRoutes");
const cargoRoutes = require("../routes/cargoRoutes");
const empresaRoutes = require("../routes/empresaRoutes");
const configReporteRoutes = require("../routes/configReporteRoutes");
const { validarJWT } = require("../middlewares/validar-jwt");
const anniversaryCron = require("../cron/anniversaryCron");
// Importar para que Sequelize sincronice la tabla automáticamente
require("./notificacionLog");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || "3001";

    // Conectar a base de datos
    this.dbConnection();

    // Middlewares
    this.middlewares();

    // Rutas de mi aplicación
    this.routes();

    // Iniciar Cron Jobs
    this.startCronJobs();
  }

  async dbConnection() {
    try {
      await db.authenticate();
      await db.sync({ alter: true }); // Sincronizar modelos y actualizar columnas faltantes
      console.log("Database online and tables synced");
    } catch (error) {
      console.error("Error connecting to database:", error);
      // throw new Error(error);
    }
  }

  middlewares() {
    // Seguridad de cabeceras HTTP
    this.app.use(helmet());

    // CORS
    this.app.use(cors());

    // Lectura y parseo del body
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ limit: "50mb", extended: true }));
  }

  routes() {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/empleado", [validarJWT], employeeRoutes);
    this.app.use("/api/nomina", [validarJWT], payrollRoutes);
    this.app.use("/api/cargos", [validarJWT], cargoRoutes);
    this.app.use("/api/empresas", [validarJWT], empresaRoutes);
    this.app.use("/api/config-reportes", [validarJWT], configReporteRoutes);

    // Manejador de errores global (Debe ir después de las rutas)
    const errorHandler = require("../middlewares/errorHandler");
    this.app.use(errorHandler);
  }

  startCronJobs() {
    anniversaryCron.start();
    console.log("Cron jobs started");
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

module.exports = Server;
