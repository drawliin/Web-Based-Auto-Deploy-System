const fs = require('fs');
const path = require('path');
const { BACKEND_PORT } = require('../config/constants');
const { readJson } = require('../utils/file');
const { renderTemplate } = require('../utils/template');
const { detectPythonEntryFile } = require('./detectionService');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const DOCKER_TEMPLATES_DIR = path.join(TEMPLATES_DIR, 'docker');
const COMPOSE_TEMPLATES_DIR = path.join(TEMPLATES_DIR, 'compose');
const COMPOSE_SERVICES_DIR = path.join(COMPOSE_TEMPLATES_DIR, 'services');

function createFrontendDockerfile(repoPath, frontendTech, folderName) {
  let apiUrlVariable;

  if (frontendTech === 'react-vite' || frontendTech === 'vue') {
    apiUrlVariable = 'VITE_API_URL';
  } else if (frontendTech === 'react') {
    apiUrlVariable = 'REACT_APP_API_URL';
  } else {
    throw new Error(`Unsupported frontend technology: ${frontendTech}`);
  }

  const dockerfile = renderTemplate(
    path.join(DOCKER_TEMPLATES_DIR, 'frontend.Dockerfile.tpl'),
    {
      API_URL_VARIABLE: apiUrlVariable,
      BACKEND_PORT,
    }
  );

  fs.writeFileSync(path.join(repoPath, folderName.frontend, 'Dockerfile'), dockerfile);
}

function createBackendDockerfile(repoPath, backendTech, folderName) {
  let dockerfile = '';

  switch (backendTech) {
    case 'nodejs': {
      const packageJson = readJson(path.join(repoPath, folderName.backend, 'package.json'));
      dockerfile = renderTemplate(
        path.join(DOCKER_TEMPLATES_DIR, 'backend-nodejs.Dockerfile.tpl'),
        {
          ENTRY_FILE: packageJson.main,
        }
      );
      break;
    }

    case 'python-flask': {
      const pythonEntryFile = detectPythonEntryFile(repoPath, folderName);

      if (!pythonEntryFile || pythonEntryFile.length === 0) {
        throw new Error('No valid Python entry file found.');
      }

      dockerfile = renderTemplate(
        path.join(DOCKER_TEMPLATES_DIR, 'backend-python-flask.Dockerfile.tpl'),
        {
          ENTRY_FILE: pythonEntryFile[0],
        }
      );
      break;
    }

    default:
      throw new Error(`Unsupported backend technology: ${backendTech}`);
  }

  fs.writeFileSync(path.join(repoPath, folderName.backend, 'Dockerfile'), dockerfile);
}

function createDatabaseDockerfile(repoPath, databaseType, folderName) {
  const templateMap = {
    mysql: 'db-mysql.Dockerfile.tpl',
    postgres: 'db-postgres.Dockerfile.tpl',
    mongodb: 'db-mongodb.Dockerfile.tpl',
    redis: 'db-redis.Dockerfile.tpl',
  };

  const templateName = templateMap[databaseType];
  if (!templateName) {
    console.log('No valid database detected.');
    return;
  }

  const dockerfile = renderTemplate(path.join(DOCKER_TEMPLATES_DIR, templateName));

  fs.writeFileSync(path.join(repoPath, folderName.database, 'Dockerfile'), dockerfile);
}

function createNginxConfig(repoPath) {
  const nginxConfig = renderTemplate(path.join(TEMPLATES_DIR, 'nginx.conf.tpl'), {
    BACKEND_PORT,
  });

  fs.writeFileSync(path.join(repoPath, 'nginx.conf'), nginxConfig);
}

function createDockerignore(repoPath) {
  const dockerignoreContent = renderTemplate(path.join(TEMPLATES_DIR, 'dockerignore.tpl'));

  fs.writeFileSync(path.join(repoPath, '.dockerignore'), dockerignoreContent);
}

function getBuildPath(frontendTech) {
  switch (frontendTech) {
    case 'react':
      return 'build';
    case 'react-vite':
    case 'vue':
      return 'dist';
    default:
      return null;
  }
}

function createDockerComposeFile(
  repoPath,
  frontendTech,
  backendTech,
  databaseType,
  clonePath,
  folderName
) {
  const frontendPath = getBuildPath(frontendTech);
  const folderNameNetwork = path.basename(clonePath);
  const networkName = `repo-network-${Math.floor(Math.random() * 1000)}`;
  const templateVariables = {
    FRONTEND_FOLDER: folderName.frontend,
    BACKEND_FOLDER: folderName.backend,
    DATABASE_FOLDER: folderName.database,
    FRONTEND_BUILD_PATH: frontendPath,
    BACKEND_PORT,
    NETWORK_NAME: networkName,
    VOLUME_NAME: `${folderNameNetwork}-data`,
  };

  let frontendService = '';
  let backendService = '';
  let databaseService = '';

  if (frontendPath) {
    frontendService = renderTemplate(
      path.join(COMPOSE_SERVICES_DIR, 'frontend.yml.tpl'),
      templateVariables
    );
  }

  const composeKey = `${backendTech}-${databaseType}`;
  const backendTemplate = path.join(COMPOSE_SERVICES_DIR, `backend-${composeKey}.yml.tpl`);
  const databaseTemplate = path.join(COMPOSE_SERVICES_DIR, `db-${databaseType}.yml.tpl`);

  if (!fs.existsSync(backendTemplate) || !fs.existsSync(databaseTemplate)) {
    throw new Error("Can't create backend or database services");
  }

  backendService = renderTemplate(backendTemplate, templateVariables);
  databaseService = renderTemplate(databaseTemplate, templateVariables);

  const services = [frontendService, backendService, databaseService]
    .filter(Boolean)
    .map((service) => service.trimEnd())
    .join('\n');

  const dockerCompose = renderTemplate(
    path.join(COMPOSE_TEMPLATES_DIR, 'docker-compose.yml.tpl'),
    {
      SERVICES_BLOCK: indent(services, 2),
      FRONTEND_FOLDER: folderName.frontend,
      FRONTEND_BUILD_PATH: frontendPath,
      FRONTEND_DEPENDS_ON: frontendPath ? 'frontend\n' : '',
      NETWORK_NAME: networkName,
      VOLUME_NAME: `${folderNameNetwork}-data`,
    }
  );

  fs.writeFileSync(path.join(repoPath, 'docker-compose.yml'), dockerCompose.trim());
}

function indent(value, spaces) {
  const padding = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => `${padding}${line}`)
    .join('\n');
}

function generateDockerArtifacts(
  repoPath,
  frontendTech,
  backendTech,
  databaseType,
  folderName
) {
  createFrontendDockerfile(repoPath, frontendTech, folderName);
  createBackendDockerfile(repoPath, backendTech, folderName);
  createDatabaseDockerfile(repoPath, databaseType, folderName);
  createDockerignore(repoPath);
  createNginxConfig(repoPath);
  createDockerComposeFile(
    repoPath,
    frontendTech,
    backendTech,
    databaseType,
    repoPath,
    folderName
  );
}

module.exports = {
  createFrontendDockerfile,
  createBackendDockerfile,
  createDatabaseDockerfile,
  createDockerignore,
  createNginxConfig,
  createDockerComposeFile,
  generateDockerArtifacts,
};
