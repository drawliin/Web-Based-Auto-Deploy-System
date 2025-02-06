const express = require('express');
const cors = require('cors');
const simpleGit = require('simple-git');
const app = express();
const port = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize simple-git
const git = simpleGit();

// Clone the repository based on the URL provided in the request
app.post('/api/clone-repo', (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ message: 'Repository URL is required.' });
  }

  // Path to clone the repository (you can adjust this to a specific folder)
  const clonePath = './cloned-repos'; // The directory where repos will be cloned

  // Clone the repository
  git.clone(repoUrl, clonePath)
    .then(() => {
      res.status(200).json({ message: `Repository cloned successfully to ${clonePath}` });
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
