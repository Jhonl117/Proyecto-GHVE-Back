const { DataTypes } = require("sequelize");
const db = require("../database/connection");

const ConfigReporte = db.define(
  "ConfigReporte",
  {
    empresas: {
      type: DataTypes.TEXT, // Almacenará un JSON array de nombres de empresas
      allowNull: false,
    },
    emails: {
      type: DataTypes.TEXT, // Correos separados por comas
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = ConfigReporte;
