const { createServer } = require('http');
const createApp = require('./src/app');
const createSocketServer = require('./src/socket');
const { PORT } = require('./src/config/constants');

const app = createApp();
const server = createServer(app);

createSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
