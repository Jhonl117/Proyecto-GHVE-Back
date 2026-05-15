// 🚀 PERFORMANCE: Deshabilitar console.log en producción
if (process.env.NODE_ENV === 'production') {
    console.log = function () {};
    console.debug = function () {};
    console.info = function () {};
    console.warn = function () {};
    console.error = function () {};
}
