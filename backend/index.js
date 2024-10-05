const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // React app URL (or change if necessary)
    methods: ["GET", "POST"],
    credentials: true,
  }
});

app.use(cors({
  origin: "http://localhost:3000", // React app URL
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json());

const connectedPCs = {}; // Store active PC clients

// Handle new connections from PC clients
io.on('connection', (socket) => {
  console.log('New PC connected:', socket.id);

  // Register the connected PC
  socket.on('registerPC', (data) => {
    connectedPCs[socket.id] = data; // Store PC info using socket ID
    console.log(`PC Registered: ${data.pcName} with ID: ${socket.id}`);
  });

  // Handle incoming screenshots from PC clients
  socket.on('sendScreenshot', (screenshotData) => {
    const pcName = connectedPCs[socket.id]?.pcName || 'Unknown PC';
    console.log(`Received screenshot from ${pcName}`);

    // Broadcast the screenshot to all connected clients (assumed to be admins)
    io.emit('newScreenshot', { pcName, screenshot: screenshotData });
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('PC disconnected:', socket.id);
    delete connectedPCs[socket.id]; // Remove disconnected PC from the list
  });
});

// API route to request screenshots from all PCs
app.post('/request-screenshots', (req, res) => {
  console.log('Admin requested screenshots');
  io.emit('takeScreenshot'); // Trigger screenshot event to all connected PCs
  res.send({ message: 'Screenshot request sent to all PCs' });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
