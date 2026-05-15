const { Router } = require('express');
const { getConfigs, postConfig, putConfig, deleteConfig } = require('../controllers/configReporteController');
const { validarJWT } = require('../middlewares/validar-jwt');
const { checkAnniversaries } = require('../cron/anniversaryCron');

const router = Router();

router.get('/', [validarJWT], getConfigs);
router.post('/', [validarJWT], postConfig);
router.put('/:id', [validarJWT], putConfig);
router.delete('/:id', [validarJWT], deleteConfig);

// Ruta para disparar manualmente el cron de aniversarios (para pruebas)
router.post('/test-cron', [validarJWT], async (req, res) => {
    try {
        console.log('🔧 Disparando cron de aniversarios manualmente...');
        await checkAnniversaries();
        res.json({ msg: '✅ Cron de aniversarios ejecutado. Revisa la consola del servidor para ver los resultados.' });
    } catch (error) {
        console.error('Error al ejecutar cron manualmente:', error);
        res.status(500).json({ msg: 'Error al ejecutar el cron', error: error.message });
    }
});

module.exports = router;
