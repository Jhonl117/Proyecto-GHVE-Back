const { response } = require('express');
const ConfigReporte = require('../models/configReporte');

const getConfigs = async (req, res = response, next) => {
    try {
        const configs = await ConfigReporte.findAll();
        res.json(configs);
    } catch (error) {
        next(error);
    }
};

const postConfig = async (req, res = response, next) => {
    const { empresas, emails, activo } = req.body;
    try {
        const config = await ConfigReporte.create({ 
            empresas: JSON.stringify(empresas), 
            emails, 
            activo 
        });
        res.json(config);
    } catch (error) {
        next(error);
    }
};

const putConfig = async (req, res = response, next) => {
    const { id } = req.params;
    const { empresas, emails, activo } = req.body;
    try {
        const config = await ConfigReporte.findByPk(id);
        if (!config) return res.status(404).json({ msg: `No existe configuración con id ${id}` });
        
        await config.update({ 
            empresas: JSON.stringify(empresas), 
            emails, 
            activo 
        });
        res.json(config);
    } catch (error) {
        next(error);
    }
};

const deleteConfig = async (req, res = response, next) => {
    const { id } = req.params;
    try {
        const config = await ConfigReporte.findByPk(id);
        if (!config) return res.status(404).json({ msg: `No existe configuración con id ${id}` });
        
        await config.destroy();
        res.json({ msg: 'Configuración eliminada' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getConfigs,
    postConfig,
    putConfig,
    deleteConfig
};
