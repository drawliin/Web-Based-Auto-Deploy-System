const express = require('express');
const cors = require('cors');
const createRepoRouter = require('./routes/repoRoutes');
const { CLIENT_ORIGINS } = require('./config/constants');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: CLIENT_ORIGINS,
      methods: ['GET', 'POST'],
    })
  );
  app.use(express.json());

  app.use('/api', createRepoRouter());

  return app;
}

module.exports = createApp;
