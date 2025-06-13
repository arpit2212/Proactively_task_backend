const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);

// Setup socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware           
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log('=== INCOMING REQUEST ===');
  console.log(`${req.method} ${req.originalUrl}`);
  console.log('========================');
  next();
});

// Basic health route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Collaborative Forms API - Debug Mode',
    status: 'Server is running'
  });
});

// Test route to ensure basic functionality
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Try importing routes one by one to identify the problematic one
console.log('Attempting to import form routes...');
try {
  const formRoutes = require('./routes/forms');
  console.log('✓ Form routes imported successfully');
  
  app.use('/api/forms', (req, res, next) => {
    console.log('=== FORMS ROUTE MIDDLEWARE ===');
    console.log(`Handling: ${req.method} ${req.originalUrl}`);
    next();
  }, formRoutes);
  
  console.log('✓ Form routes registered successfully');
} catch (error) {
  console.error('✗ Error importing/registering form routes:', error.message);
  console.error('Stack:', error.stack);
}

console.log('Attempting to import auth routes...');
try {
  const { router: authRoutes } = require('./routes/auth');
  console.log('✓ Auth routes imported successfully');
  
  app.use('/api/auth', (req, res, next) => {
    console.log('=== AUTH ROUTE MIDDLEWARE ===');
    console.log(`Handling: ${req.method} ${req.originalUrl}`);
    next();
  }, authRoutes);
  
  console.log('✓ Auth routes registered successfully');
} catch (error) {
  console.error('✗ Error importing/registering auth routes:', error.message);
  console.error('Stack:', error.stack);
}

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.originalUrl
  });
});

// Realtime Collaboration with Socket.io
const formSessions = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-form', ({ formId, userId, username }) => {
    socket.join(formId);
    if (!formSessions.has(formId)) {
      formSessions.set(formId, new Set());
    }
    formSessions.get(formId).add({ userId, username, socketId: socket.id });
    socket.to(formId).emit('user-joined', { userId, username });
    const activeUsersInForm = Array.from(formSessions.get(formId));
    socket.emit('active-users', activeUsersInForm);
  });

  socket.on('field-update', ({ formId, fieldId, value, userId }) => {
    socket.to(formId).emit('field-updated', {
      fieldId, value, updatedBy: userId, timestamp: new Date().toISOString()
    });
  });

  socket.on('field-lock', ({ formId, fieldId, userId, username }) => {
    socket.to(formId).emit('field-locked', {
      fieldId, lockedBy: userId, username, timestamp: new Date().toISOString()
    });
  });

  socket.on('field-unlock', ({ formId, fieldId, userId }) => {
    socket.to(formId).emit('field-unlocked', {
      fieldId, unlockedBy: userId, timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [formId, users] of formSessions.entries()) {
      const userArray = Array.from(users);
      const disconnectedUser = userArray.find(user => user.socketId === socket.id);
      if (disconnectedUser) {
        users.delete(disconnectedUser);
        socket.to(formId).emit('user-left', {
          userId: disconnectedUser.userId,
          username: disconnectedUser.username
        });
        if (users.size === 0) {
          formSessions.delete(formId);
        }
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`🧪 Test route: http://localhost:${PORT}/test`);
});