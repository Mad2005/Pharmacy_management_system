import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import connectDB from './server/config/db.js';
import { seedData } from './server/seed.js';
import { setupApiRoutes } from './server/routes/api.js';

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  const PORT = process.env.PORT || 3000;

  // Connect to Database
  console.log('Attempting to connect to database...');
  await connectDB();
  
  // Seed Data
  console.log('Checking if data seeding is needed...');
  await seedData();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // API Routes
  app.use('/api', setupApiRoutes(io));

  // Catch-all for API routes to prevent falling through to Vite
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
