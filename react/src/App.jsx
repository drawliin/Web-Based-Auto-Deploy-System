import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import HowItWorks from './HowItWorks';
import './App.css';

const socket = io('http://localhost:5001');

function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [disableInput, setDisableInput] = useState(false);
  const [wsMessages, setWsMessages] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const terminalRef = useRef(null);

  useEffect(() => {
    socket.on('status', (message) => {
      if(message.includes('Deploying')){
        let tempMessages = [...wsMessages];
        tempMessages[tempMessages.length-1] = message;
      }else{
        setWsMessages((prevMessages) => [...prevMessages, message]);
        setShowTerminal(true);
      }
    });

    return () => {
      socket.off('status');
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [wsMessages]);

  const handleClone = async () => {
    if (repoUrl) {
      setDisableInput(true);
      setWsMessages([]);
      setShowTerminal(true);
      try {
        await fetch('http://localhost:5001/api/clone-repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl }),
        });
      } catch (error) {
        console.log('Error cloning repo:', error);
        setWsMessages(prev => [...prev, "🚨 Server Problem.. Try Again"]);
        setDisableInput(false);
      }
    }
  };

  const getMessageClass = (msg) => {
    if (msg.includes('🚨')) {
      return 'error-message';
    } else if (msg.includes('<a')) {
      return 'link-message';
    } else {
      return '';
    }
  };

  return (
    <div className='container'>
      <div className='navbar'>
        <Link to="/" className="home-link">GitHub AutoDeploy App</Link>
        <div>
          <a href="https://github.com/drawliin/web-based-auto-deploy-system.git" target='_blank'>Source Code</a>
          <Link to="/how-it-works">How it works?</Link>
        </div>
      </div>

      <div className="app-container">
        <div className={`input-container ${showTerminal ? 'moved-up' : ''}`}>
          <h1 className="title"><img src='./github-logo.png' /> Clone a GitHub Repo</h1>
          <div className="input-box">
            <input
              type="text"
              placeholder="Enter GitHub Repo URL"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={disableInput}
            />
            <button onClick={handleClone} disabled={disableInput}>
              Clone Repo
            </button>
          </div>
        </div>

        {showTerminal && (
          <div ref={terminalRef} className={`terminal ${showTerminal ? 'show-terminal' : ''}`}>
            {wsMessages.map((msg, index) => (
              <div key={index} className={getMessageClass(msg)}>
                {msg.includes('<a') ? (
                  <span dangerouslySetInnerHTML={{ __html: msg }} />
                ) : (
                  msg
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
      </Routes>
    </Router>
  );
}

export default App;
