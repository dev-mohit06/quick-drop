const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

// Utilities
const corsOptions = require('./utils/cors.util.js');

// Configurations
const redisClient = require('./config/redis.config.js'); // Redis client

// Routes
const routes = require('./routes/index.route.js');

const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.io

const io = new Server(server, {
    cors: {
        origin: ["https://quick-drop-ten.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

// ==============================
// 🔹 Middleware Configuration
// ==============================

// Enable CORS with custom options
app.use(cors(corsOptions));

// Parse incoming request bodies
app.use(express.json()); // For JSON data
app.use(express.urlencoded({ extended: false })); // For URL-encoded data

// Register application routes
app.use(routes);

// Initialize Socket.io Controller
require('./controllers/socket.controller.js')(io);

// ==============================
// 🔹 Start the Server
// ==============================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

if (!redisClient.connect()) {
    redisClient.connect()
        .then(() => {
            console.log('Connected to Redis');
        });
}

// Make sure to use `server.listen()` to listen on both HTTP and WebSocket
server.listen(PORT, () => {
    console.log(`🚀 Server running at port ${PORT}`);
});