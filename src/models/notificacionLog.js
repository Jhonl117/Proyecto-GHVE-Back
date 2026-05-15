const { DataTypes } = require("sequelize");
const db = require("../database/connection");

const NotificacionLog = db.define(
  "NotificacionLog",
  {
    tipo: {
      type: DataTypes.ENUM('aniversario', 'vencimiento_contrato', 'otro'),
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Año del aniversario notificado (ej: 2026)"
    },
    destinatarios: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Correos a los que se envió"
    },
    estado: {
      type: DataTypes.ENUM('enviado', 'fallido'),
      defaultValue: 'enviado',
    },
    error_msg: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Mensaje de error si falló el envío"
    }
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['tipo', 'employee_id', 'anio'],
        name: 'unique_notification_per_year'
      }
    ]
  }
);

module.exports = NotificacionLog;
