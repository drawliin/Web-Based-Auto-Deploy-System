const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const { CLONED_REPOS_DIR } = require('../config/constants');

const git = simpleGit();

function generateUniqueFolderName(repoUrl) {
  const repoName = repoUrl.split('/').pop().replace('.git', '');
  const timestamp = Date.now();
  const uniqueName = `${repoName}-${timestamp}`;

  return path.join(CLONED_REPOS_DIR, uniqueName);
}

function deleteRepo(repoPath) {
  try {
    fs.rmSync(repoPath, { recursive: true, force: true });
    console.log(`Repository at ${repoPath} has been deleted.`);
  } catch (error) {
    console.error('Error deleting the repository:', error);
  }
}

async function cloneRepository(repoUrl, clonePath) {
  await git.clone(repoUrl, clonePath);
}

module.exports = {
  generateUniqueFolderName,
  deleteRepo,
  cloneRepository,
};
