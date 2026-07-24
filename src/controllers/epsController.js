const { response } = require('express');
const Eps = require('../models/eps');

const getEps = async (req, res = response, next) => {
    try {
        const eps = await Eps.findAll({
            order: [['nombre', 'ASC']]
        });

        res.json(eps);
    } catch (error) {
        next(error);
    }
};

const postEps = async (req, res = response, next) => {
    const { nombre } = req.body;

    try {
        const eps = await Eps.create({ nombre });

        res.json(eps);
    } catch (error) {
        next(error);
    }
};

const putEps = async (req, res = response, next) => {
    const { id } = req.params;
    const { nombre, estado } = req.body;

    try {
        const eps = await Eps.findByPk(id);

        if (!eps) {
            return res.status(404).json({
                msg: `No existe una EPS con el id ${id}`
            });
        }

        await eps.update({ nombre, estado });

        res.json(eps);

    } catch (error) {
        next(error);
    }
};

const deleteEps = async (req, res = response, next) => {
    const { id } = req.params;

    try {
        const eps = await Eps.findByPk(id);

        if (!eps) {
            return res.status(404).json({
                msg: `No existe una EPS con el id ${id}`
            });
        }

        await eps.destroy();

        res.json({
            msg: 'EPS eliminada'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEps,
    postEps,
    putEps,
    deleteEps
};