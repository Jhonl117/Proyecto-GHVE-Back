const { Router } = require('express');
const { check } = require('express-validator');
const { login, forgotPassword, resetPassword, seedAdmin, changePassword } = require('../controllers/authController');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post('/login', [
    check('username', 'El nombre de usuario es obligatorio').not().isEmpty(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
], login);

router.post('/change-password', [
    validarJWT,
    check('oldPassword', 'La contraseña actual es obligatoria').not().isEmpty(),
    check('newPassword', 'La nueva contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
], changePassword);

router.post('/forgot-password', [
    check('email', 'El correo es obligatorio').isEmail(),
], forgotPassword);

router.post('/reset-password/:token', [
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
], resetPassword);

// Ruta para inicializar el primer administrador (usar solo una vez)
router.get('/seed', seedAdmin);

module.exports = router;


//http://localhost:3001/api/auth/seed