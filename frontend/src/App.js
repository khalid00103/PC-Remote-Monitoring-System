import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

// Connect to the backend server using the server's LAN IP
const socket = io('http://192.168.31.237:5000', { // Replace with your server's LAN IP
  transports: ['websocket'], // Use WebSocket transport
  upgrade: false,
});

function App() {
  const [screenshots, setScreenshots] = useState([]);

  useEffect(() => {
    // Listen for 'newScreenshot' events from the server
    socket.on('newScreenshot', (data) => {
      setScreenshots((prev) => [...prev, data]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('newScreenshot');
    };
  }, []);

  const requestScreenshots = () => {
    axios.post('http://192.168.31.237:5000/request-screenshots') // Replace with your server's LAN IP
      .then(() => console.log('Request sent to all PCs'))
      .catch(err => console.error('Error requesting screenshots:', err));
  };

  return (
    <div className="App">
      <h1>Admin Dashboard</h1>
      <button onClick={requestScreenshots}>Request Screenshots</button>
      <div className="screenshots-grid">
        {screenshots.map((screenshot, idx) => (
          <div key={idx} className="screenshot-item">
            <h3>{screenshot.pcName}</h3>
            <img src={`data:image/png;base64,${screenshot.screenshot}`} alt={`Screenshot from ${screenshot.pcName}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
