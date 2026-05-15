const { response } = require('express');
const Cargo = require('../models/cargo');

const getCargos = async (req, res = response, next) => {
    try {
        const cargos = await Cargo.findAll({ order: [['nombre', 'ASC']] });
        res.json(cargos);
    } catch (error) {
        next(error);
    }
};

const postCargo = async (req, res = response, next) => {
    const { nombre } = req.body;
    try {
        const cargo = await Cargo.create({ nombre });
        res.json(cargo);
    } catch (error) {
        next(error);
    }
};

const putCargo = async (req, res = response, next) => {
    const { id } = req.params;
    const { nombre, estado } = req.body;
    try {
        const cargo = await Cargo.findByPk(id);
        if (!cargo) return res.status(404).json({ msg: `No existe un cargo con el id ${id}` });
        
        await cargo.update({ nombre, estado });
        res.json(cargo);
    } catch (error) {
        next(error);
    }
};

const deleteCargo = async (req, res = response, next) => {
    const { id } = req.params;
    try {
        const cargo = await Cargo.findByPk(id);
        if (!cargo) return res.status(404).json({ msg: `No existe un cargo con el id ${id}` });
        
        await cargo.destroy();
        res.json({ msg: 'Cargo eliminado' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCargos,
    postCargo,
    putCargo,
    deleteCargo
};
