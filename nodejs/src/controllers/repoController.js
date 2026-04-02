const { DEPLOYED_APP_URL } = require('../config/constants');
const {
  generateUniqueFolderName,
  deleteRepo,
  cloneRepository,
} = require('../services/repositoryService');
const { validateRepositoryUrl } = require('../services/validationService');
const {
  isFullStackApp,
  detectFrontendTechnology,
  detectBackendTechnology,
  detectDatabase,
} = require('../services/detectionService');
const { generateDockerArtifacts } = require('../services/dockerGeneratorService');
const { deployRepository, waitForNginx } = require('../services/deploymentService');
const { sendStatus, sendStatusDelayed } = require('../socket/statusChannel');

async function cloneRepo(req, res) {
  const { repoUrl } = req.body;

  const validatedUrl = await validateRepositoryUrl(repoUrl);
  if (!validatedUrl) {
    sendStatus('Not a valid URL');
    res.status(400).json({ error: 'Invalid repository URL.' });
    return;
  }

  const clonePath = generateUniqueFolderName(repoUrl);
  sendStatus('Cloning repository...');
  res.status(202).json({ message: 'Repository cloning started.' });

  try {
    await cloneRepository(repoUrl, clonePath);

    const repoFoldersName = isFullStackApp(clonePath);
    if (!repoFoldersName) {
      throw new Error('This project does not have a valid full-stack app structure.');
    }

    sendStatusDelayed('Repository cloned successfully!', 1500);

    const frontendTech = detectFrontendTechnology(clonePath, repoFoldersName);
    const backendTech = detectBackendTechnology(clonePath, repoFoldersName);
    const databaseTech = detectDatabase(clonePath, backendTech, repoFoldersName);

    if (frontendTech === 'unknown') {
      throw new Error('Frontend technology not detected. Deployment cannot proceed.');
    }

    if (backendTech === 'unknown') {
      throw new Error('Backend technology not detected. Deployment cannot proceed.');
    }

    if (databaseTech === 'unknown') {
      throw new Error('Database technology not detected. Deployment cannot proceed.');
    }

    sendStatusDelayed('Creating Dockerfiles...', 2000);
    generateDockerArtifacts(
      clonePath,
      frontendTech,
      backendTech,
      databaseTech,
      repoFoldersName
    );
    sendStatusDelayed('Dockerfiles created!', 4000);
    sendStatusDelayed('Docker-compose created!', 7000);
    sendStatusDelayed('Starting deployment...', 9000);

    await deployRepository(clonePath);

    const nginxReady = await waitForNginx();
    if (!nginxReady) {
      throw new Error('Deployment Failed: Nginx did not become ready within the expected time.');
    }

    sendStatus('Deployment completed successfully!');
    sendStatus(`View Deployed App: ${DEPLOYED_APP_URL}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    deleteRepo(clonePath);
    sendStatusDelayed(`Error: ${error.message}`, 8500);
  }
}

module.exports = {
  cloneRepo,
};
