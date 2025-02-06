const express = require('express');
const cors = require('cors');
const simpleGit = require('simple-git');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const port = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize simple-git
const git = simpleGit();

// Function to create a unique folder for each cloned repo
const generateUniqueFolderName = (repoUrl) => {
  const repoName = repoUrl.split('/').pop().replace('.git', '');
  const timestamp = Date.now();
  const uniqueName = `${repoName}-${timestamp}`;
  return path.join(__dirname, 'cloned-repos', uniqueName);
};

// Function to check if the cloned repo has the full-stack app structure
const isFullStackApp = (repoPath) => {
    const requiredFolders = ['frontend', 'backend', 'database'];
    
    return requiredFolders.every(folder => {
      return fs.existsSync(path.join(repoPath, folder));
    });
};

// Deleting unwanted repos
const deleteRepo = (repoPath) => {
    try {
      fs.rmSync(repoPath, { recursive: true, force: true }); 
      console.log(`Repository at ${repoPath} has been deleted.`);
    } catch (err) {
      console.error('Error deleting the repository:', err);
    }
};

// Function to detect the frontend technology
const detectFrontendTechnology = (repoPath) => {
  const packageJsonPath = path.join(repoPath, 'frontend', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    if (packageJson.dependencies && packageJson.dependencies.react) {
      return 'react';
    } else if (packageJson.dependencies && packageJson.dependencies.vue) {
      return 'vue';
    } else if (fs.existsSync(path.join(repoPath, 'frontend', 'angular.json'))) {
      return 'angular';
    }
  }
  return 'unknown';
};

// Function to detect the backend technology
const detectBackendTechnology = (repoPath) => {
  const packageJsonPath = path.join(repoPath, 'backend', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    if (packageJson.dependencies && packageJson.dependencies.express) {
      return 'nodejs-express';
    }
  }
  return 'unknown';
};

// Function to create a Dockerfile for the frontend based on technology
const createFrontendDockerfile = (repoPath, frontendTech) => {
  let dockerfile = '';
  if (frontendTech === 'react') {
    dockerfile = `
      # Dockerfile for React app
      FROM node:latest AS build
      WORKDIR /app
      COPY package*.json ./
      RUN npm install
      COPY ./ ./
      RUN npm run build

      FROM nginx:alpine
      COPY --from=build /app/dist /usr/share/nginx/html
      EXPOSE 80
      CMD ["nginx", "-g", "daemon off;"]
    `;
  } else if (frontendTech === 'vue') {
    dockerfile = `
      # Dockerfile for Vue app
      FROM node:latest AS build
      WORKDIR /app
      COPY package*.json ./
      RUN npm install
      COPY ./ ./
      RUN npm run build

      FROM nginx:alpine
      COPY --from=build /app/dist /usr/share/nginx/html
      EXPOSE 80
      CMD ["nginx", "-g", "daemon off;"]
    `;
  } else if (frontendTech === 'angular') {
    dockerfile = `
      # Dockerfile for Angular app
      FROM node:latest AS build
      WORKDIR /app
      COPY package*.json ./
      RUN npm install
      COPY ./ ./
      RUN npm run build --prod

      FROM nginx:alpine
      COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
      EXPOSE 80
      CMD ["nginx", "-g", "daemon off;"]
    `;
  }
  
  const dockerignoreContent = `
      node_modules
      logs
      *.log
      .env
      /build
      /dist
      /.next
      /out
      /.cache
      .vscode/
      .idea/
      .DS_Store
      Thumbs.db
      .git
      .gitignore
      __pycache__/
      *.pyc
      *.pyo
      *.pyd
      venv/
      vendor/
  `;

  fs.writeFileSync(path.join(repoPath, 'frontend', 'Dockerfile'), dockerfile);

  fs.writeFileSync(path.join(repoPath, '.dockerignore'), dockerignoreContent);
  
};

// Function to create a Dockerfile for the backend based on technology
const createBackendDockerfile = (repoPath, backendTech) => {
  let dockerfile = '';
  if (backendTech === 'nodejs-express') {
    dockerfile = `
      # Dockerfile for Node.js backend
      FROM node:latest
      WORKDIR /app
      COPY backend/package*.json ./
      RUN npm install
      COPY backend/ ./
      EXPOSE 5000
      CMD ["npm", "start"]
    `;
  }
  fs.writeFileSync(path.join(repoPath, 'backend', 'Dockerfile'), dockerfile);
};

// Function to create a docker-compose.yml file
const createDockerComposeFile = (repoPath) => {
  const dockerCompose = `
    version: '3'
    services:
      frontend:
        build:
          context: .
          dockerfile: frontend/Dockerfile
        ports:
          - "80:80"
        networks:
          - app-network
      backend:
        build:
          context: .
          dockerfile: backend/Dockerfile
        ports:
          - "5000:5000"
        networks:
          - app-network
    networks:
      app-network:
        driver: bridge
  `;
  fs.writeFileSync(path.join(repoPath, 'docker-compose.yml'), dockerCompose);
};


// Clone the repository based on the URL provided in the request
app.post('/api/clone-repo', (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ message: 'Repository URL is required.' });
  }

  // Create a unique folder for the new repository
  const clonePath = generateUniqueFolderName(repoUrl);


  // Clone the repository
  git.clone(repoUrl, clonePath)
    .then(() => {
        if (isFullStackApp(clonePath)) {
            // Detect frontend and backend technologies
            const frontendTech = detectFrontendTechnology(clonePath);
            
            
            const backendTech = detectBackendTechnology(clonePath);

            // Create Dockerfiles for frontend and backend
            createFrontendDockerfile(clonePath, frontendTech);
            
            
            createBackendDockerfile(clonePath, backendTech);
            
            // Create docker-compose.yml
            
            createDockerComposeFile(clonePath);

            //Automatically build and deploy
            exec(`cd ${clonePath} && docker-compose up --build -d`, (err, stdout, stderr) => {
                if (err) {
                  console.log("Deployment Error:", stderr);
                  return res.status(500).json({ message: 'Error deploying application.' });
                }
                console.log("Deployment Success:", stdout);
                res.status(200).json({ message: 'Application deployed successfully!', url: 'http://localhost' });
            });
            
        }else {
            res.status(400).json({ message: 'This project does not have a valid full-stack app structure.' });
            deleteRepo(clonePath);
        }
    })
    .catch((err) => {
      console.error('Error cloning repo:', err);
      res.status(500).json({ message: 'Error cloning repository', error: err.message });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
