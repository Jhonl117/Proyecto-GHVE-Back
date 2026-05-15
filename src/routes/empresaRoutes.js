const { Router } = require('express');
const { getEmpresas, postEmpresa, putEmpresa, deleteEmpresa } = require('../controllers/empresaController');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/', [validarJWT], getEmpresas);
router.post('/', [validarJWT], postEmpresa);
router.put('/:id', [validarJWT], putEmpresa);
router.delete('/:id', [validarJWT], deleteEmpresa);

module.exports = router;
