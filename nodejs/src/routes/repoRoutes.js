const express = require('express');
const { cloneRepo } = require('../controllers/repoController');

function createRepoRouter() {
  const router = express.Router();

  router.post('/clone-repo', cloneRepo);

  return router;
}

module.exports = createRepoRouter;
