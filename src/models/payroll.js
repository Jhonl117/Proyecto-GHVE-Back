const { DataTypes } = require("sequelize");
const db = require("../database/connection");
const Employee = require("./employee");

const Payroll = db.define(
  "Payroll",
  {
    periodo: {
      type: DataTypes.STRING, // Ej: '2024-05'
      allowNull: false,
    },
    quincena: {
      type: DataTypes.INTEGER, // 1 o 2
      allowNull: false,
    },
    salario_base_momento: {
      type: DataTypes.DECIMAL(10, 2), // El salario que tenía el empleado en ese momento
      allowNull: false,
    },
    dias_trabajados: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    // Recargos (en horas para calcular o valor ya calculado)
    recargos_nocturnos: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    recargos_dominicales: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    recargos_festivos: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    horas_extras: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    
    // Bonos específicos
    bono_alimentacion: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    bono_movilidad: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    bono_desempeño: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    bono_referidos: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    
    // Otros
    otros_ingresos: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    descuentos: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    
    total_devengado: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_pagar: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Relación: Una nómina pertenece a un empleado
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'empleado' });
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'nominas' });

module.exports = Payroll;
