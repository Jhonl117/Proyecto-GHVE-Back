const { response } = require('express');
const Empresa = require('../models/empresa');

const getEmpresas = async (req, res = response, next) => {
    try {
        const empresas = await Empresa.findAll({ order: [['nombre', 'ASC']] });
        res.json(empresas);
    } catch (error) {
        next(error);
    }
};

const postEmpresa = async (req, res = response, next) => {
    const { nombre, email_reportes, recibir_notificaciones } = req.body;
    try {
        const empresa = await Empresa.create({ nombre, email_reportes, recibir_notificaciones });
        res.json(empresa);
    } catch (error) {
        next(error);
    }
};

const putEmpresa = async (req, res = response, next) => {
    const { id } = req.params;
    const { nombre, email_reportes, recibir_notificaciones, estado } = req.body;
    try {
        const empresa = await Empresa.findByPk(id);
        if (!empresa) return res.status(404).json({ msg: `No existe una empresa con el id ${id}` });
        
        await empresa.update({ nombre, email_reportes, recibir_notificaciones, estado });
        res.json(empresa);
    } catch (error) {
        next(error);
    }
};

const deleteEmpresa = async (req, res = response, next) => {
    const { id } = req.params;
    try {
        const empresa = await Empresa.findByPk(id);
        if (!empresa) return res.status(404).json({ msg: `No existe una empresa con el id ${id}` });
        
        await empresa.destroy();
        res.json({ msg: 'Empresa eliminada' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEmpresas,
    postEmpresa,
    putEmpresa,
    deleteEmpresa
};
