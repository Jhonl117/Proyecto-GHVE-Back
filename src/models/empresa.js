const { DataTypes } = require("sequelize");
const db = require("../database/connection");

const Empresa = db.define(
  "Empresa",
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "El nombre de la empresa es obligatorio" },
      },
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Empresa;
