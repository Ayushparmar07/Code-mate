import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";
import { initializeSocket } from "./config/socket.js";
import { registerSocketHandlers } from "./socket/socketHandlers.js";
import { startCleanupService } from "./services/cleanupService.js";

dotenv.config();

// -------------------- EXPRESS SETUP --------------------
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

const server = http.createServer(app);

// -------------------- SOCKET.IO SETUP --------------------
const io = initializeSocket(server);

// -------------------- DATABASE CONNECTION --------------------
connectDatabase();

// -------------------- CLEANUP SERVICE --------------------
startCleanupService(io);

// -------------------- SOCKET HANDLERS --------------------
registerSocketHandlers(io);

// -------------------- ERROR HANDLING --------------------
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
