const { response } = require('express');
const { Op } = require('sequelize');
const Employee = require('../models/employee');

const getEmployees = async (req, res = response, next) => {
    try {
        const employees = await Employee.findAll();
        res.json(employees);
    } catch (error) {
        next(error);
    }
};

const getEmployee = async (req, res = response, next) => {
    const { id } = req.params;
    try {
        const employee = await Employee.findByPk(id);
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ msg: `No existe un empleado con el id ${id}` });
        }
    } catch (error) {
        next(error);
    }
};

const postEmployee = async (req, res = response, next) => {
    const { body } = req;

    body.nombre_completo = body.nombre_completo?.toUpperCase();
    body.contacto_emergencia = body.contacto_emergencia?.toUpperCase();
    body.parentesco_otro = body.parentesco_otro?.toUpperCase();
    body.cargo = body.cargo?.toUpperCase();
    body.empresa = body.empresa?.toUpperCase();
    body.eps = body.eps?.toUpperCase();
    body.fondo_pension = body.fondo_pension?.toUpperCase();

    try {
        const employee = await Employee.create(body);
        res.json(employee);
    } catch (error) {
        next(error);
    }
};

const putEmployee = async (req, res = response, next) => {
    const { id } = req.params;
    const { body } = req;
    try {
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ msg: `No existe un empleado con el id ${id}` });
        }

        await employee.update(body);
        res.json(employee);
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res = response, next) => {
    const { id } = req.params;
    try {
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ msg: `No existe un empleado con el id ${id}` });
        }

        await employee.destroy();
        res.json({ msg: 'Empleado eliminado' });
    } catch (error) {
        next(error);
    }
};

const toggleEmployeeStatus = async (req, res = response, next) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ msg: `No existe un empleado con el id ${id}` });
        }

        await employee.update({ estado });
        res.json(employee);
    } catch (error) {
        next(error);
    }
};

const getExpiringContracts = async (req, res = response, next) => {
    try {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        const expiringEmployees = await Employee.findAll({
            where: {
                estado: true,
                fecha_vencimiento_contrato: {
                    [Op.between]: [today, nextMonth]
                }
            },
            order: [['fecha_vencimiento_contrato', 'ASC']]
        });

        res.json(expiringEmployees);
    } catch (error) {
        next(error);
    }
};

const postEmployeesBulk = async (req, res = response, next) => {
  console.log('🔵 LLEGÓ AL BULK ENDPOINT', req.body.empleados?.length, 'registros'); 
  const { empleados } = req.body;
 
  try {
    if (!empleados || !Array.isArray(empleados)) {
      return res.status(400).json({ msg: 'Formato de datos inválido' });
    }
 
    const procesados = empleados.map((emp) => {
      const cedula = emp.cedula ? String(emp.cedula).trim().split('.')[0] : '';
      if (!cedula) return null;
 
      return {
        cedula,
        nombre_completo            : emp.nombre_completo       ? String(emp.nombre_completo).trim().toUpperCase()     : null,
        fecha_ingreso              : emp.fecha_ingreso          || null,
        fecha_nacimiento           : emp.fecha_nacimiento       || null,
        celular                    : emp.celular                ? String(emp.celular).trim().split('.')[0]             : null,
        correo_electronico         : emp.correo_electronico     ? String(emp.correo_electronico).trim().toLowerCase()  : null,
        contacto_emergencia        : emp.contacto_emergencia    ? String(emp.contacto_emergencia).trim().toUpperCase() : null,
        parentesco                 : emp.parentesco             || null,
        parentesco_otro            : emp.parentesco_otro   || null,  
        cargo                      : emp.cargo                  ? String(emp.cargo).trim().toUpperCase()               : null,
        empresa                    : emp.empresa                ? String(emp.empresa).trim().toUpperCase()             : null,
        eps                        : emp.eps                    ? String(emp.eps).trim().toUpperCase()                 : null,
        fondo_pension              : emp.fondo_pension          ? String(emp.fondo_pension).trim().toUpperCase()       : null,
        estado                     : true,
        tipo_contrato              : emp.tipo_contrato          || 'Obra o Labor',
        fecha_vencimiento_contrato : emp.fecha_vencimiento_contrato || null,
        salario_base               : emp.salario_base           || 0,
      };
    }).filter(Boolean);
 
    if (procesados.length === 0) {
      return res.status(400).json({ msg: 'No se encontraron registros válidos con cédula.' });
    }
 
    const db = require('../database/connection');

    console.log('🔵 Iniciando transacción con', procesados.length, 'registros'); // ← agregar

    await db.transaction(async (t) => {
    for (const emp of procesados) {
        await Employee.create(emp, {
        validate   : true,
        transaction: t,
        });
      }
    });

    console.log('✅ TRANSACCIÓN COMPLETADA, enviando respuesta...'); // ← agrega esto

    res.json({
        msg   : `Importación exitosa. ${procesados.length} empleados registrados.`,
        count : procesados.length,
        total : empleados.length,
    });
 
  } catch (error) {
    console.log('❌ ERROR ATRAPADO:', error.name, '-', error.message); // ← agregar
    next(error); // el errorHandler global lo recibe
  }
};

const deleteEmployeesBulk = async (req, res, next) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'No se proporcionaron IDs válidos para eliminar' });
    }

    try {
        await Employee.destroy({
            where: { id: ids }
        });

        res.json({ msg: `Se han eliminado ${ids.length} empleados correctamente` });
    } catch (error) {
        next(error);
    }
};

const getAnniversaryAlerts = async (req, res = response, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación exacta

        const employees = await Employee.findAll({
            where: { estado: true }
        });

        const alerts = employees.filter(emp => {
            if (!emp.fecha_ingreso) return false;
            
            const ingreso = new Date(emp.fecha_ingreso);
            ingreso.setHours(0, 0, 0, 0);

            // No contar empleados que ingresaron este mismo año (no tienen aniversario aún)
            if (ingreso.getFullYear() === today.getFullYear() && ingreso >= today) return false;

            // Calcular el aniversario de este año
            const thisYearAnniversary = new Date(today.getFullYear(), ingreso.getMonth(), ingreso.getDate());
            
            // Si el aniversario ya pasó este año, mirar el del próximo año
            if (thisYearAnniversary < today) {
                thisYearAnniversary.setFullYear(today.getFullYear() + 1);
            }

            const diffTime = thisYearAnniversary - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays <= 30 && diffDays >= 0;
        });

        res.json(alerts);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEmployees,
    getEmployee,
    postEmployee,
    putEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    postEmployeesBulk,
    deleteEmployeesBulk,
    getExpiringContracts,
    getAnniversaryAlerts
};
