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

const postEmployeesBulk = async (req, res = response) => {
    const { empleados } = req.body;
    try {
        if (!empleados || !Array.isArray(empleados)) {
            return res.status(400).json({ msg: 'Formato de datos inválido' });
        }

        // Pre-procesar: convertir campos vacíos a null (no inventar datos)
        const procesados = empleados.map((emp) => {
            const cedula = emp.cedula ? emp.cedula.toString().trim() : '';
            if (!cedula) return null; // Sin cédula = no se carga

            return {
                cedula,
                nombre_completo: emp.nombre_completo ? emp.nombre_completo.toString().trim() : null,
                fecha_ingreso: emp.fecha_ingreso || null,
                fecha_nacimiento: emp.fecha_nacimiento || null,
                celular: emp.celular ? emp.celular.toString().trim() : null,
                correo_electronico: emp.correo_electronico ? emp.correo_electronico.toString().trim() : null,
                contacto_emergencia: emp.contacto_emergencia || null,
                parentesco: emp.parentesco || null,
                telefono_contacto: emp.telefono_contacto ? emp.telefono_contacto.toString().trim() : null,
                cargo: emp.cargo || null,
                empresa: emp.empresa || null,
                eps: emp.eps || null,
                fondo_pension: emp.fondo_pension || null,
                estado: true,
                tipo_contrato: emp.tipo_contrato || 'Obra o Labor',
                fecha_vencimiento_contrato: emp.fecha_vencimiento_contrato || null,
                salario_base: emp.salario_base || 0
            };
        }).filter(emp => emp !== null);

        if (procesados.length === 0) {
            return res.status(400).json({ msg: 'No se encontraron registros válidos con cédula.' });
        }

        const result = await Employee.bulkCreate(procesados, { 
            ignoreDuplicates: true,
            validate: false 
        });

        res.json({
            msg: `Importación exitosa. Se procesaron ${result.length} de ${empleados.length} empleados.`,
            count: result.length,
            total: empleados.length
        });
    } catch (error) {
        console.error('Error en carga masiva:', error.message || 'Error desconocido');
        
        let detalles = ['Error desconocido en la carga masiva'];
        if (error.errors && Array.isArray(error.errors)) {
            const mensajes = error.errors.map(e => {
                if (e.errors && e.errors.errors) {
                    return e.errors.errors.map(ve => ve.message);
                }
                return e.message || 'Error de validación';
            }).flat();
            detalles = [...new Set(mensajes)];
        } else if (error.message) {
            detalles = [error.message];
        }

        res.status(400).json({
            msg: `Error en la carga masiva.`,
            detalles,
            total: empleados.length
        });
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
