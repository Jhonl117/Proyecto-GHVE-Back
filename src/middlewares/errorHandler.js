const errorHandler = (err, req, res, next) => {
 console.log('🚨🚨🚨 ENTRÓ AL ERROR HANDLER 🚨🚨🚨'); // ← agrega esto
  // ── 1. Errores de carga masiva (bulkCreate con individualHooks: true) ────────
  // Sequelize lanza un AggregateError que contiene un error por cada fila fallida
  if (
    err.name === 'AggregateError' ||
    err.name === 'SequelizeBulkRecordError' ||
    (err.errors && Array.isArray(err.errors) && err.errors.length > 0 &&
      (err.errors[0]?.name === 'SequelizeUniqueConstraintError' ||
       err.errors[0]?.name === 'SequelizeValidationError'))
  ) {
    console.error(`--- ERROR CARGA MASIVA: ${err.errors?.length} filas con problemas ---`);
 
    const detalles = (err.errors || [])
      .map(e => {
        // Errores de validación por fila
        if (e.errors?.errors) return e.errors.errors.map(ve => ve.message);
        // Errores de unicidad por fila
        if (e.errors) return e.errors.map(ve => ve.message);
        return [e.message || 'Error desconocido'];
      })
      .flat()
      .filter(Boolean);
 
    const unicos = [...new Set(detalles)];
 
    return res.status(400).json({
      msg            : `Error en carga masiva. ${err.errors?.length || 0} registros con problemas.`,
      detalles       : unicos,
      cantidadErrores: err.errors?.length || 0,
    });
  }
 
  // ── 2. Error de validación individual ────────────────────────────────────────
  if (err.name === 'SequelizeValidationError') {
    console.error('--- ERROR VALIDACIÓN ---');
    return res.status(400).json({
      msg   : 'Error de validación',
      errors: err.errors.map(e => e.message),
    });
  }
 
  // ── 3. Error de duplicado individual ─────────────────────────────────────────
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path  || '';
    const value = err.errors[0]?.value || '';
 
    const mensajes = {
      cedula            : `La cédula "${value}" ya está registrada`,
      correo_electronico: `El correo "${value}" ya está registrado`,
      celular           : `El celular "${value}" ya está registrado`,
    };
 
    console.error(`--- ERROR DUPLICADO: campo "${field}" valor "${value}" ---`);
 
    return res.status(409).json({
      msg   : mensajes[field] ?? `El campo "${field}" ya existe con el valor "${value}"`,
      errors: [err.errors[0].message],
    });
  }
 
  // ── 4. Error de conexión a base de datos ──────────────────────────────────────
  if (
    err.name === 'SequelizeConnectionError' ||
    err.name === 'SequelizeConnectionRefusedError'
  ) {
    console.error('--- ERROR CONEXIÓN BD ---', err.message);
    return res.status(503).json({
      msg: 'No se pudo conectar a la base de datos. Intenta de nuevo.',
    });
  }
 
  // ── 5. Error genérico ─────────────────────────────────────────────────────────
  console.error('--- ERROR INTERNO ---');
  console.error(err.message || err);
  console.error(err);
 
  res.status(500).json({
    msg  : 'Error interno del servidor',
    error: err.message,
    name : err.name, 
  });
};

module.exports = errorHandler;
