const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { 
    getPayrolls, 
    getPayroll, 
    postPayroll, 
    getPayrollByEmployee,
    deletePayroll,
    putPayroll
} = require('../controllers/payrollController');

const router = Router();

// Todas las rutas de nómina están protegidas
router.use(validarJWT);

router.get('/', getPayrolls);
router.get('/:id', getPayroll);
router.get('/empleado/:employeeId', getPayrollByEmployee);
router.post('/', postPayroll);
router.put('/:id', putPayroll);
router.delete('/:id', deletePayroll);

module.exports = router;
