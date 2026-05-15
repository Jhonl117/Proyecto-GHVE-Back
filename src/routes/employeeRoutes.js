const { Router } = require('express');
const { check } = require('express-validator');
const { validateFields } = require('../middlewares/validateFields');
const { validarJWT } = require('../middlewares/validar-jwt');
const { 
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
} = require('../controllers/employeeController');

const router = Router();

router.get('/', [validarJWT], getEmployees);
router.get('/alertas/vencimientos', [validarJWT], getExpiringContracts);
router.get('/aniversarios', [validarJWT], getAnniversaryAlerts);
router.post('/bulk', [validarJWT], postEmployeesBulk);
router.post('/bulk-delete', [validarJWT], deleteEmployeesBulk);

router.get('/:id', [
    check('id', 'El ID no es válido').isNumeric(),
    validateFields
], getEmployee);

router.post('/', [
    check('cedula', 'La cédula es obligatoria y debe ser numérica').isNumeric(),
    check('nombre_completo', 'El nombre es obligatorio').not().isEmpty(),
    check('correo_electronico', 'El correo no es válido').isEmail(),
    check('celular', 'El celular debe tener 10 dígitos').isLength({ min: 10, max: 10 }).isNumeric(),
    validateFields
], postEmployee);

router.put('/:id', [
    check('id', 'El ID no es válido').isNumeric(),
    check('correo_electronico', 'El correo no es válido').optional().isEmail(),
    check('celular', 'El celular debe tener 10 dígitos').optional().isLength({ min: 10, max: 10 }).isNumeric(),
    validateFields
], putEmployee);

router.delete('/:id', [
    check('id', 'El ID no es válido').isNumeric(),
    validateFields
], deleteEmployee);

router.patch('/:id/estado', [
    check('id', 'El ID no es válido').isNumeric(),
    check('estado', 'El estado es obligatorio y debe ser booleano').isBoolean(),
    validateFields
], toggleEmployeeStatus);

module.exports = router;
