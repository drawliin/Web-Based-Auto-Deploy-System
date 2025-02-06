import React, { useState } from 'react';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleClone = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clone-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error('Error cloning repo:', error);
      setMessage('Error cloning repo');
    }
  };

  return (
    <div>
      <h1>Clone a GitHub Repo</h1>
      <input
        type="text"
        placeholder="Enter GitHub Repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
      />
      <button onClick={handleClone}>Clone Repo</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
