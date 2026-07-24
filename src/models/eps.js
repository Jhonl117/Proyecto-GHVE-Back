const { DataTypes } = require("sequelize");
const db = require("../database/connection");

const Eps = db.define(
  "Eps",
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "El nombre de la EPS es obligatorio" },
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

module.exports = Eps;