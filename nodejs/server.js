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
      const viteJSBundlerPath = path.join(repoPath, 'frontend', 'vite.config.js');
      const viteTSBundlerPath = path.join(repoPath, 'frontend', 'vite.config.ts');
      if(fs.existsSync(viteJSBundlerPath) || fs.existsSync(viteTSBundlerPath)){
        return 'react-vite';
      }
      return 'react';
    } else if (packageJson.dependencies && packageJson.dependencies.vue) {
      return 'vue';
    } else if (fs.existsSync(path.join(repoPath, 'frontend', 'angular.json'))) {
      return 'angular';
    }
  }
  return 'unknown';
};

// Function to detect the backend technology and its PORT
const detectBackendTechnology = (repoPath) => {
  const files = fs.readdirSync(repoPath);

  // ✅ Node.js
  if (fs.existsSync(path.join(repoPath, 'backend', 'package.json'))) return 'nodejs';

  return 'unknown';
};

const detectNodeEntryFile = (repoPath) => {
  try {
      const packageJson = require(path.join(repoPath, 'backend', 'package.json'));
      if (packageJson.main) return [packageJson.main];
  } catch (error) {
      console.log('Error reading package.json:', error);
  }
  return ['server.js', 'index.js', 'app.js']; // Fallback
};
const detectPythonEntryFile = (repoPath) => {
  const backendPath = path.join(repoPath, 'backend');

  // ✅ Prioritize manage.py if it exists (Django projects)
  if (fs.existsSync(path.join(backendPath, 'manage.py'))) return ['manage.py'];

  // Get all Python files
  const pyFiles = fs.readdirSync(backendPath).filter(file => file.endsWith('.py'));

  // ✅ Look for __main__ function
  for (const file of pyFiles) {
      const filePath = path.join(backendPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('__main__')) return [file];
  }

  return null; // No clear entry file found
};


const detectBackendPort = (repoPath, technology) => {
  // 1️⃣ Check .env file first
  const envFilePath = path.join(repoPath, 'backend', '.env');
  if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf-8');
      const portMatch = envContent.match(/\w*PORT\s*=\s*(\d+)/);
      if (portMatch) return parseInt(portMatch[1], 10);
  }

  // 2️⃣ Look for port definitions in common backend files
  const techPortPatterns = {
      'nodejs': /listen\s*\(\s*(\d+)/,  // app.listen(3000)
      'python': /run\(\s*host=.*?,\s*port\s*=\s*(\d+)/,  // Flask app.run(port=5000)
      'php': /'port'\s*=>\s*(\d+)/,  // Laravel config
  };

  const filesToCheck = {
      'nodejs': detectNodeEntryFile(repoPath),
      'python': detectPythonEntryFile(repoPath),
      'php': ['config/app.php'], // Laravel config file
  };

  if (!filesToCheck[technology]) return 'invalid technology';

  for (const file of filesToCheck[technology]) {
      const filePath = path.join(repoPath, 'backend', file);
      if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const match = content.match(techPortPatterns[technology]);
          if (match) return parseInt(match[1], 10);
      }
  }

  return 'no port found'; // Return null if no port is found
};

// Function to create a Dockerfile for the frontend based on technology
const createFrontendDockerfile = (repoPath, frontendTech) => {
  let dockerfile = '';
  if (frontendTech === 'react-vite' || frontendTech === 'react' || frontendTech === 'vue') {
    dockerfile = `
      # Dockerfile for React app
      FROM node:alpine AS build
      WORKDIR /app
      COPY package*.json ./
      RUN npm install
      COPY ./ ./
      RUN npm run build

      FROM nginx:alpine
      COPY --from=build /app/${frontendTech === 'react' ? 'build' : 'dist'} /usr/share/nginx/html
      EXPOSE 80
      CMD ["nginx", "-g", "daemon off;"]
    `;
  } else if (frontendTech === 'angular') {
    dockerfile = `
      # Dockerfile for Angular app
      FROM node:alpine AS build
      WORKDIR /app
      COPY package*.json ./
      RUN npm install
      COPY ./ ./
      RUN npm run build

      FROM nginx:alpine
      COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
      EXPOSE 80
      CMD ["nginx", "-g", "daemon off;"]
    `;
  }

  fs.writeFileSync(path.join(repoPath, 'frontend', 'Dockerfile'), dockerfile);
};

// Function to create a Dockerfile for the backend based on technology
const createBackendDockerfile = (repoPath, backendTech, port) => {
  let dockerfile = '';
  if (backendTech === 'nodejs') {
    const packageJson = require(path.join(repoPath, 'backend', 'package.json'));
    dockerfile = `
      # Dockerfile for Node.js backend
      FROM node:alpine
      WORKDIR /app
      COPY package*.json ./
      RUN npm install
      COPY ./ ./
      EXPOSE ${port}
      CMD ["node", "${packageJson.main}"]
    `;
  }
  fs.writeFileSync(path.join(repoPath, 'backend', 'Dockerfile'), dockerfile);
};

// Function to create dockerignore
const createDockerignore = (repoPath) => {
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
  fs.writeFileSync(path.join(repoPath, '.dockerignore'), dockerignoreContent);
};

// Function to create a docker-compose.yml file
const createDockerComposeFile = (repoPath, port) => {
  const dockerCompose = `
    services:
      frontend:
        build:
          context: ./frontend
          dockerfile: Dockerfile
        ports:
          - "80:80"
        networks:
          - app-network
      backend:
        build:
          context: ./backend
          dockerfile: Dockerfile
        ports:
          - "${port}:${port}"
        networks:
          - app-network
    networks:
      app-network:
        driver: bridge
  `;
  fs.writeFileSync(path.join(repoPath, 'docker-compose.yml'), dockerCompose);
};

// Function to check if all containers are running


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

            const port = detectBackendPort(clonePath, backendTech);

            // Create Dockerfiles for frontend and backend
            createFrontendDockerfile(clonePath, frontendTech);
            createBackendDockerfile(clonePath, backendTech, port);

            // Create dockerignore
            createDockerignore(clonePath);
            
            // Create docker-compose.yml
            createDockerComposeFile(clonePath, port);

            //Automatically build and deploy
            // add cache ignore later
            exec(`cd ${clonePath} && docker-compose up --build -d`, (err, stdout, stderr) => {
                if (err) {
                  console.log("Deployment Error:", stderr);
                  if(err.toString().includes("port is already allocated")){
                    return res.status(500).json({ message: `
                      <p>🚨 Deployment Failed: Port Conflict 🚨</p>
                      <p>🔍 Reason: Another container or service is already using the required port.</p>
                      ` });
                  }else if(err.toString().includes('error during connect')){
                    return res.status(500).json({ message: `🚨 Docker Desktop is not running. Please start Docker and try again. 🚨` });
                  }
                  return res.status(500).json({ message: `Error deploying application: ${stderr}` });
                }

                console.log("Deployment Success:", stdout);
                res.status(200).json({ message: `Application deployed successfully! <a href='http://localhost:80' target=_blank>Deployed Page</a>` });
            });
            
        }else {
            res.status(400).json({ message: 'This project does not have a valid full-stack app structure.' });
            deleteRepo(clonePath);
        }
    })
    .catch((err) => {
      console.log('Error cloning repo:', err);
      res.status(500).json({ message: 'Error cloning repository', error: err.message });
    });
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

