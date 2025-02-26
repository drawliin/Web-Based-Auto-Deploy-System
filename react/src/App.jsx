import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { GitBranch, Github } from 'lucide-react'; // Import the Github icon from lucide-react
import './App.css';

const socket = io('http://localhost:5001');

function FloatingGithubIcon({ size, top, left, direction }) {
  return (
    <div
      className={`floating-icon ${direction}`}
      style={{
        width: `${size}px`,
        top: `${top}%`,
        left: `${left}%`,
      }}
    >
      <Github size={size} color="grey" />
    </div>
  );
}

function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [disableInput, setDisableInput] = useState(false);
  const [wsMessages, setWsMessages] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const terminalRef = useRef(null);
  const [floatingIcons, setFloatingIcons] = useState([]);
  const platforms = ["GitHub", "GitLab", "Bitbucket"];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    socket.on('status', (message) => {
      if (message.includes('Deploying')) {
        let tempMessages = [...wsMessages];
        tempMessages[tempMessages.length - 1] = message;
      } else {
        setWsMessages((prevMessages) => [...prevMessages, message]);
        setShowTerminal(true);
      }
    });

    return () => {
      socket.off('status');
    };
  }, [wsMessages]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [wsMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);  // Start fade-out for platform name

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % platforms.length); // Change platform
        setFade(true); // Start fade-in
      }, 500); // Delay to allow fade-out

    }, 4000); 

    return () => clearInterval(interval); // Clean up interval
  }, []);

  useEffect(() => {
    const generateFloatingIcons = () => {
      const icons = [];
      const directions = ['from-top', 'from-bottom', 'from-left', 'from-right'];
      for (let i = 0; i < 50; i++) { // 50 floating icons
        const size = Math.random() * 30 + 11; // Random size between 10 and 40
        const top = Math.random() * 100; // Random top position
        const left = Math.random() * 100; // Random left position
        const direction = directions[Math.floor(Math.random() * directions.length)]; // Random direction
        icons.push(<FloatingGithubIcon key={i} size={size} top={top} left={left} direction={direction} />);
      }
      return icons;
    };
  
    setFloatingIcons(generateFloatingIcons());
  }, []);

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
        setWsMessages((prev) => [...prev, '🚨 Server Problem.. Try Again']);
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
      {floatingIcons}
      <div className='navbar'>
        <a href="/" className="home-link">GitHub AutoDeploy App</a>
        <div>
          <a href="https://github.com/drawliin/web-based-auto-deploy-system.git" target='_blank'>Source Code</a>
          <a href="https://github.com/drawliin/web-based-auto-deploy-system/blob/main/README.md" target='_blank'>How It works?</a>
          
        </div>
      </div>

      <div className="app-container">
        <div className={`input-container ${showTerminal ? 'moved-up' : ''}`}>
          <h1 className="title">
            <img src='./github-logo.png' alt='GitHub Logo' /> 
            Clone a 
            <span className={`platform-name transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}>
              {platforms[index]}
            </span> Repo
          </h1>

          <div className="input-box">
            <input
              type="text"
              placeholder="Enter GitHub Repo URL"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={disableInput}
            />
            <button onClick={handleClone} disabled={disableInput}>
              <GitBranch className="button-icon" />
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

      <footer>
            Built by <a target='_blank' href="https://github.com/drawliin" rel="noreferrer">Houssam Eddine HAMOUICH</a> | <a target='_blank' href="https://github.com/BCHAYMAE" rel="noreferrer">Chaymae BELLAHCENE</a>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Home/>
  );
}

export default App;
