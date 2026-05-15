const { response } = require('express');
const Payroll = require('../models/payroll');
const Employee = require('../models/employee');

const getPayrolls = async (req, res = response) => {
    try {
        const payrolls = await Payroll.findAll({
            include: [{ model: Employee, as: 'empleado', attributes: ['nombre_completo', 'cedula', 'cargo'] }]
        });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener nóminas', error });
    }
};

const getPayroll = async (req, res = response) => {
    const { id } = req.params;
    try {
        const payroll = await Payroll.findByPk(id, {
            include: [{ model: Employee, as: 'empleado' }]
        });
        if (!payroll) return res.status(404).json({ msg: 'Nómina no encontrada' });
        res.json(payroll);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener la nómina', error });
    }
};

const getPayrollByEmployee = async (req, res = response) => {
    const { employeeId } = req.params;
    try {
        const payrolls = await Payroll.findAll({
            where: { employeeId },
            order: [['createdAt', 'DESC']]
        });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener nóminas del empleado', error });
    }
};

const postPayroll = async (req, res = response) => {
    const { 
        employeeId, periodo, quincena, dias_trabajados,
        recargos_nocturnos, recargos_dominicales, recargos_festivos, horas_extras,
        bono_alimentacion, bono_movilidad, bono_desempeño, bono_referidos,
        otros_ingresos, descuentos, comentarios
    } = req.body;

    try {
        const employee = await Employee.findByPk(employeeId);
        if (!employee) return res.status(404).json({ msg: 'Empleado no encontrado' });

        // Cálculo de totales
        const salario_base_momento = employee.salario_base || 0;
        
        // El total devengado es la suma de todo lo positivo
        const total_devengado = parseFloat(salario_base_momento / 2) + // Pago quincenal base
                                parseFloat(recargos_nocturnos) + 
                                parseFloat(recargos_dominicales) + 
                                parseFloat(recargos_festivos) + 
                                parseFloat(horas_extras) +
                                parseFloat(bono_alimentacion) + 
                                parseFloat(bono_movilidad) + 
                                parseFloat(bono_desempeño) + 
                                parseFloat(bono_referidos) + 
                                parseFloat(otros_ingresos);

        const total_pagar = total_devengado - parseFloat(descuentos);

        const payroll = await Payroll.create({
            employeeId, periodo, quincena, dias_trabajados,
            salario_base_momento,
            recargos_nocturnos, recargos_dominicales, recargos_festivos, horas_extras,
            bono_alimentacion, bono_movilidad, bono_desempeño, bono_referidos,
            otros_ingresos, descuentos,
            total_devengado, total_pagar,
            comentarios
        });

        res.status(201).json(payroll);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear el registro de nómina', error: error.message });
    }
};

const deletePayroll = async (req, res = response) => {
    const { id } = req.params;
    try {
        const payroll = await Payroll.findByPk(id);
        if (!payroll) return res.status(404).json({ msg: 'Nómina no encontrada' });

        await payroll.destroy();
        res.json({ msg: 'Registro de nómina eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la nómina', error });
    }
};

const putPayroll = async (req, res = response) => {
    const { id } = req.params;
    const { 
        periodo, quincena, dias_trabajados,
        recargos_nocturnos, recargos_dominicales, recargos_festivos, horas_extras,
        bono_alimentacion, bono_movilidad, bono_desempeño, bono_referidos,
        otros_ingresos, descuentos, comentarios
    } = req.body;

    try {
        const payroll = await Payroll.findByPk(id, { include: [{ model: Employee, as: 'empleado' }] });
        if (!payroll) return res.status(404).json({ msg: 'Nómina no encontrada' });

        const employee = payroll.empleado;
        const salario_base_momento = employee.salario_base || 0;

        // Recalcular totales
        const total_devengado = parseFloat(salario_base_momento / 2) + 
                                parseFloat(recargos_nocturnos) + 
                                parseFloat(recargos_dominicales) + 
                                parseFloat(recargos_festivos) + 
                                parseFloat(horas_extras) +
                                parseFloat(bono_alimentacion) + 
                                parseFloat(bono_movilidad) + 
                                parseFloat(bono_desempeño) + 
                                parseFloat(bono_referidos) + 
                                parseFloat(otros_ingresos);

        const total_pagar = total_devengado - parseFloat(descuentos);

        await payroll.update({
            periodo, quincena, dias_trabajados,
            recargos_nocturnos, recargos_dominicales, recargos_festivos, horas_extras,
            bono_alimentacion, bono_movilidad, bono_desempeño, bono_referidos,
            otros_ingresos, descuentos,
            total_devengado, total_pagar,
            comentarios
        });

        res.json(payroll);
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar la nómina', error });
    }
};

module.exports = {
    getPayrolls,
    getPayroll,
    getPayrollByEmployee,
    postPayroll,
    deletePayroll,
    putPayroll
};
