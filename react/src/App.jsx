import React, { useState, } from 'react';


function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [message, setMessage] = useState('');

  

  const handleClone = async () => {
    setMessage('Start Cloning Repo...');
    try {
      const response = await fetch('http://localhost:5001/api/clone-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();
      setMessage(data.message);
    }catch (error) {
      console.log('Error cloning repo:', error);
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
      <button onClick={handleClone} disabled={message === 'Server problem' || message === 'Initializing...'}>Clone Repo</button>
      {message && <div dangerouslySetInnerHTML={{ __html: message }} />}
    </div>
  );
}

export default App;
