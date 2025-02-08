import React, { useState } from 'react';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [message, setMessage] = useState('');

  const handleClone = async () => {
    setMessage('Repository cloning...');
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
      setMessage('Server problem');
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
      <button onClick={handleClone} disabled={message === 'Server problem' || message === 'Repository cloning...'}>Clone Repo</button>
      {message && <div dangerouslySetInnerHTML={{ __html: message }} />}
    </div>
  );
}

export default App;
