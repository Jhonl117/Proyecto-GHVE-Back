const { response, request } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const validarJWT = async (req = request, res = response, next) => {
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            msg: 'No hay token en la petición'
        });
    }

    try {
        const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY || 'V3Pr0d_S3cr3t_K3y');

        // Leer el usuario que corresponde al uid
        const user = await User.findByPk(uid);

        if (!user) {
            return res.status(401).json({
                msg: 'Token no válido - usuario no existe en DB'
            });
        }

        // Verificar si el uid tiene estado true
        if (!user.estado) {
            return res.status(401).json({
                msg: 'Token no válido - usuario con estado: false'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({
            msg: 'Token no válido'
        });
    }
};

const esAdminRole = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Se quiere verificar el role sin validar el token primero'
        });
    }

    const { role, username } = req.user;

    if (role !== 'ADMIN_ROLE') {
        return res.status(401).json({
            msg: `${username} no es administrador - No puede hacer esto`
        });
    }

    next();
};

module.exports = {
    validarJWT,
    esAdminRole
};
