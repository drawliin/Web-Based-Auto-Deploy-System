const fs = require('fs');
const path = require('path');
const { readJson } = require('../utils/file');

function findComponentFolder(repoPath, componentNames) {
  const folders = fs.readdirSync(repoPath);

  for (const folder of folders) {
    if (componentNames.includes(folder.toLowerCase())) {
      return folder;
    }
  }

  return null;
}

function isFullStackApp(repoPath) {
  const frontendNames = ['frontend', 'client', 'web', 'ui', 'app'];
  const backendNames = ['backend', 'server', 'api', 'services'];
  const databaseNames = ['database', 'db', 'data', 'storage'];

  const frontendFolder = findComponentFolder(repoPath, frontendNames);
  const backendFolder = findComponentFolder(repoPath, backendNames);
  const databaseFolder = findComponentFolder(repoPath, databaseNames);

  if (frontendFolder && backendFolder && databaseFolder) {
    return {
      frontend: frontendFolder,
      backend: backendFolder,
      database: databaseFolder,
    };
  }

  return false;
}

function readRequirementsFile(requirementsPath) {
  const buffer = fs.readFileSync(requirementsPath);
  return buffer.toString('utf16le').replace(/\r/g, '').trim().toLowerCase();
}

function detectFrontendTechnology(repoPath, folderName) {
  const packageJsonPath = path.join(repoPath, folderName.frontend, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return 'unknown';
  }

  const packageJson = readJson(packageJsonPath);
  const dependencies = packageJson.dependencies || {};

  if (dependencies.react) {
    const viteJSBundlerPath = path.join(repoPath, folderName.frontend, 'vite.config.js');
    const viteTSBundlerPath = path.join(repoPath, folderName.frontend, 'vite.config.ts');

    if (fs.existsSync(viteJSBundlerPath) || fs.existsSync(viteTSBundlerPath)) {
      return 'react-vite';
    }

    return 'react';
  }

  if (dependencies.vue) {
    return 'vue';
  }

  return 'unknown';
}

function detectBackendTechnology(repoPath, folderName) {
  const backendPath = path.join(repoPath, folderName.backend);
  const requirementsPath = path.join(backendPath, 'requirements.txt');

  if (fs.existsSync(path.join(backendPath, 'package.json'))) {
    return 'nodejs';
  }

  if (fs.existsSync(requirementsPath)) {
    const requirements = readRequirementsFile(requirementsPath);

    if (requirements.includes('flask')) {
      return 'python-flask';
    }
  }

  return 'unknown';
}

function detectPythonEntryFile(repoPath, folderName) {
  const backendPath = path.join(repoPath, folderName.backend);
  const pyFiles = fs.readdirSync(backendPath).filter((file) => file.endsWith('.py'));

  for (const file of pyFiles) {
    const filePath = path.join(backendPath, file);
    const content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('__main__')) {
      return [file];
    }
  }

  return null;
}

function detectDatabase(repoPath, backendTech, folderName) {
  const databasePath = path.join(repoPath, folderName.database);

  if (fs.existsSync(databasePath)) {
    const envPath = path.join(databasePath, '.env');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');

      if (envContent.includes('DB_CONNECTION=mysql')) {
        return 'mysql';
      }

      if (envContent.includes('DB_CONNECTION=pgsql')) {
        return 'postgres';
      }

      if (envContent.includes('MONGO_URI')) {
        return 'mongodb';
      }
    }
  }

  switch (backendTech) {
    case 'nodejs': {
      const packageJsonPath = path.join(repoPath, folderName.backend, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        break;
      }

      const packageJson = readJson(packageJsonPath);
      const dependencies = packageJson.dependencies || {};

      if (dependencies.mysql || dependencies.mysql2) {
        return 'mysql';
      }

      if (dependencies.pg) {
        return 'postgres';
      }

      if (dependencies.mongodb || dependencies.mongoose) {
        return 'mongodb';
      }

      break;
    }

    case 'python-flask': {
      const requirementsPath = path.join(repoPath, folderName.backend, 'requirements.txt');

      if (!fs.existsSync(requirementsPath)) {
        break;
      }

      const requirements = readRequirementsFile(requirementsPath);

      if (
        requirements.includes('mysqlclient') ||
        requirements.includes('mysql-connector-python') ||
        requirements.includes('pymysql') ||
        (requirements.includes('sqlalchemy') && requirements.includes('mysql'))
      ) {
        return 'mysql';
      }

      if (requirements.includes('psycopg2')) {
        return 'postgres';
      }

      if (requirements.includes('pymongo')) {
        return 'mongodb';
      }

      break;
    }

    default:
      throw new Error('No database found!!');
  }

  return 'unknown';
}

module.exports = {
  isFullStackApp,
  detectFrontendTechnology,
  detectBackendTechnology,
  detectPythonEntryFile,
  detectDatabase,
};
