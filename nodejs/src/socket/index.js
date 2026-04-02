const { Server } = require('socket.io');
const { CLIENT_ORIGINS } = require('../config/constants');
const { initializeStatusChannel } = require('./statusChannel');

function createSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGINS,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  initializeStatusChannel(io);
  return io;
}

module.exports = createSocketServer;
