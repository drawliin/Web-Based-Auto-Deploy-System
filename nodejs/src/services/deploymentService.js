const { exec } = require('child_process');
const { DEPLOYED_APP_URL } = require('../config/constants');

function deployRepository(clonePath) {
  return new Promise((resolve, reject) => {
    exec(`cd ${clonePath} && docker-compose up --build -d`, (error, stdout, stderr) => {
      if (error) {
        console.log('Deployment Error:', stderr);

        if (stderr.includes('port is already allocated')) {
          reject(
            new Error(
              'Deployment Failed: Port Conflict. Another service is using the required port.'
            )
          );
          return;
        }

        if (stderr.includes('error during connect')) {
          reject(new Error('Docker Desktop is not running. Please start Docker and try again.'));
          return;
        }

        if (stderr.includes('exec: "gunicorn": executable file not found in $PATH')) {
          reject(
            new Error(
              'Deployment Failed: Gunicorn is not installed. Please ensure Gunicorn is added to your application dependencies.'
            )
          );
          return;
        }

        reject(new Error(`Error deploying application: ${stderr}`));
        return;
      }

      console.log('Deployment Success:', stdout);
      resolve();
    });
  });
}

async function checkNginx() {
  try {
    const response = await fetch(DEPLOYED_APP_URL);
    return response.status === 200;
  } catch (error) {
    console.error('Error checking Nginx:', error.message);
    return false;
  }
}

async function waitForNginx(maxRetries = 50, delayMs = 4000) {
  let retries = maxRetries;

  while (retries > 0) {
    const nginxReady = await checkNginx();

    if (nginxReady) {
      return true;
    }

    retries -= 1;
    console.log('Waiting for Nginx to be ready...');
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

module.exports = {
  deployRepository,
  waitForNginx,
};
