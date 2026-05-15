const { Router } = require('express');
const { getCargos, postCargo, putCargo, deleteCargo } = require('../controllers/cargoController');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get('/', [validarJWT], getCargos);
router.post('/', [validarJWT], postCargo);
router.put('/:id', [validarJWT], putCargo);
router.delete('/:id', [validarJWT], deleteCargo);

module.exports = router;
