const { Router } = require('express');

const {
    getEps,
    postEps,
    putEps,
    deleteEps
} = require('../controllers/epsController');

const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/', [validarJWT], getEps);

router.post('/', [validarJWT], postEps);

router.put('/:id', [validarJWT], putEps);

router.delete('/:id', [validarJWT], deleteEps);

module.exports = router;