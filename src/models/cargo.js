const { DataTypes } = require("sequelize");
const db = require("../database/connection");

const Cargo = db.define(
  "Cargo",
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "El nombre del cargo es obligatorio" },
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

module.exports = Cargo;
