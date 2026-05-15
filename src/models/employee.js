const { DataTypes } = require("sequelize");
const db = require("../database/connection");

const Employee = db.define(
  "Employee",
  {
    cedula: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: { msg: "La cédula debe contener solo números" },
        notEmpty: { msg: "La cédula es obligatoria" },
      },
    },
    nombre_completo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre completo es obligatorio" },
      },
    },
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    celular: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isNumeric: { msg: "El celular debe contener solo números" },
        len: {
          args: [10, 10],
          msg: "El celular debe tener exactamente 10 dígitos",
        },
      },
    },
    correo_electronico: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: { msg: "El formato del correo electrónico no es válido" },
      },
    },
    contacto_emergencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentesco: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentesco_otro: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telefono_contacto: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isNumeric: {
          msg: "El teléfono de contacto debe contener solo números",
        },
      },
    },
    cargo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    empresa: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    eps: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fondo_pension: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tipo_contrato: {
      type: DataTypes.ENUM('Obra o Labor', 'Término Indefinido', 'Aprendizaje', 'Temporal'),
      defaultValue: 'Obra o Labor',
    },
    fecha_vencimiento_contrato: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    salario_base: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Employee;
