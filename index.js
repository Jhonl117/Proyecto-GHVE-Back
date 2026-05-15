require('dotenv').config()

// 🚀 PERFORMANCE: Deshabilitar console.log en producción
require('./src/utils/consoleOptimizer');

const Server = require('./src/models/server');

const server = new Server();
server.listen();
