let ioInstance;

const statusQueue = [];
let isProcessing = false;

function emitStatus(message) {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit('status', message);
}

function processStatusQueue() {
  if (statusQueue.length === 0 || isProcessing) {
    return;
  }

  isProcessing = true;
  const { message, delay } = statusQueue.shift();

  setTimeout(() => {
    emitStatus(message);
    isProcessing = false;
    processStatusQueue();
  }, delay);
}

function initializeStatusChannel(io) {
  ioInstance = io;
}

function sendStatus(message) {
  emitStatus(message);
}

function sendStatusDelayed(message, delay = 1000) {
  statusQueue.push({ message, delay });
  processStatusQueue();
}

module.exports = {
  initializeStatusChannel,
  sendStatus,
  sendStatusDelayed,
};
