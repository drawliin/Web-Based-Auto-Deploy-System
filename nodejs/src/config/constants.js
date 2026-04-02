const path = require('path');

const PORT = 5001;
const DEPLOYED_APP_URL = 'http://localhost:8081';
const BACKEND_PORT = 4002;
const CLONED_REPOS_DIR = path.join(__dirname, '..', '..', 'cloned-repos');
const CLIENT_ORIGINS = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:5175',
];

module.exports = {
  PORT,
  DEPLOYED_APP_URL,
  BACKEND_PORT,
  CLONED_REPOS_DIR,
  CLIENT_ORIGINS,
};
