const errorHandler = (err, req, res, next) => {
    // Si es un error de validación masiva, no imprimimos todo el objeto para no saturar la consola
    if (err.name === 'SequelizeBulkRecordError') {
        console.error(`--- ERROR DE CARGA MASIVA: ${err.errors.length} errores detectados ---`);
        
        // Obtenemos solo los mensajes únicos para no repetir 500 veces lo mismo
        const uniqueErrors = [...new Set(err.errors.map(e => e.message))];
        
        return res.status(400).json({
            msg: `Error en la carga masiva. Se encontraron ${err.errors.length} fallos de validación.`,
            detalles: uniqueErrors,
            cantidadErrores: err.errors.length
        });
    }

    console.error('--- ERROR DETECTADO ---');
    console.error(err.message || err);

    // Errores de validación individuales
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            msg: 'Error de validación',
            errors: err.errors.map(e => e.message)
        });
    }

    // Errores de duplicados (Cédula, Correo, Celular)
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors[0].path;
        let msg = 'Dato duplicado';
        if (field === 'cedula') msg = 'La cédula ya existe';
        if (field === 'correo_electronico') msg = 'El correo ya existe';
        if (field === 'celular') msg = 'El celular ya existe';

        return res.status(400).json({
            msg,
            errors: [err.errors[0].message]
        });
    }

    // Error genérico
    res.status(500).json({
        msg: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Consulte al administrador'
    });
};

module.exports = errorHandler;
