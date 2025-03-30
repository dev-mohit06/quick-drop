const redisClient = require('../config/redis.config.js'); // Redis client
const { v4: uuidv4 } = require('uuid');

const generateSessionCode = () => {
    // Generate a UUID, extract digits, and take the first 6
    return uuidv4().replace(/\D/g, '').substring(0, 6);
}

module.exports = (io) => {
    // Socket.io logic
    io.on('connection', (socket) => {
        console.log(`⚡ A user connected: ${socket.id}`);

        // When a user creates a session (file sender)
        socket.on('create-session', async (_, callback) => {
            try {
                const sessionId = generateSessionCode();
                await redisClient.setEx(sessionId, 1800, JSON.stringify({ sender: socket.id }));
                socket.join(sessionId);
                socket.sessionId = sessionId;  // Store session ID in the socket object
                console.log(`Session created: ${sessionId}`);

                if (callback) callback({ success: true, sessionId }); // Send session code back to sender
            } catch (error) {
                console.error(`Error creating session: ${error.message}`);
                if (callback) callback({ success: false, error: "Failed to create session" });
            }
        });

        // When another user joins the session (file receiver)
        socket.on('join-session', async ({ sessionId }, callback) => {
            try {
                const session = await redisClient.get(sessionId);

                if (session) {
                    const parsedSession = JSON.parse(session);
                    socket.join(sessionId);
                    socket.sessionId = sessionId;
                    
                    // Store receiver's socket ID in session data
                    parsedSession.receiver = socket.id;
                    await redisClient.setEx(sessionId, 1800, JSON.stringify(parsedSession));
                    
                    // Notify both peers about connection
                    io.to(sessionId).emit('peer-connected', { 
                        receiver: socket.id,
                        sender: parsedSession.sender 
                    });
                    
                    console.log(`User joined session: ${sessionId}`);
                    if (callback) callback({ success: true });
                } else {
                    if (callback) callback({ success: false, error: "Session not found" });
                }
            } catch (error) {
                console.error(`Error joining session: ${error.message}`);
                if (callback) callback({ success: false, error: "Failed to join session" });
            }
        });

        // WebRTC Signaling - handle SDP offer
        socket.on('webrtc-offer', ({ sessionId, offer, target }) => {
            console.log(`Forwarding WebRTC offer to ${target} in session ${sessionId}`);
            socket.to(target).emit('webrtc-offer', {
                offer,
                sender: socket.id
            });
        });

        // WebRTC Signaling - handle SDP answer
        socket.on('webrtc-answer', ({ sessionId, answer, target }) => {
            console.log(`Forwarding WebRTC answer to ${target} in session ${sessionId}`);
            socket.to(target).emit('webrtc-answer', {
                answer,
                sender: socket.id
            });
        });

        // WebRTC Signaling - handle ICE candidates
        socket.on('webrtc-ice-candidate', ({ sessionId, candidate, target }) => {
            console.log(`Forwarding ICE candidate to ${target} in session ${sessionId}`);
            socket.to(target).emit('webrtc-ice-candidate', {
                candidate,
                sender: socket.id
            });
        });

        // Handle file transfer status updates
        socket.on('transfer-status', ({ sessionId, status }) => {
            socket.to(sessionId).emit('transfer-status', status);
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.id}`);

            // Notify other peers in the session about disconnection
            const sessionId = socket.sessionId;
            if (sessionId) {
                socket.to(sessionId).emit('peer-disconnected', { peerId: socket.id });
                
                // Clean up session data
                try {
                    const session = await redisClient.get(sessionId);
                    if (session) {
                        const parsedSession = JSON.parse(session);
                        // Only delete if it's empty (both parties disconnected)
                        if (parsedSession.sender === socket.id || parsedSession.receiver === socket.id) {
                            if (parsedSession.sender === socket.id) {
                                // If sender disconnects, session is no longer valid
                                await redisClient.del(sessionId);
                                console.log(`Session ${sessionId} removed from Redis.`);
                            } else {
                                // If receiver disconnects, update session
                                delete parsedSession.receiver;
                                await redisClient.setEx(sessionId, 1800, JSON.stringify(parsedSession));
                                console.log(`Receiver removed from session ${sessionId}.`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error cleaning up session: ${error.message}`);
                }
            }
        });
    });
}