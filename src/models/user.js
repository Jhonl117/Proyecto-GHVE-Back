const { DataTypes } = require("sequelize");
const db = require("../database/connection");

const User = db.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "El nombre de usuario es obligatorio" },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "El formato del correo electrónico no es válido" },
        notEmpty: { msg: "El correo electrónico es obligatorio" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("ADMIN_ROLE", "USER_ROLE"),
      defaultValue: "ADMIN_ROLE",
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetTokenExpire: {
      type: DataTypes.DATE,
      allowNull: true,
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

module.exports = User;
