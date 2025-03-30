# QuickDrop Server

QuickDrop is a server-side application designed to facilitate file sharing between peers using WebSockets and WebRTC. This server handles session creation, peer connections, and signaling for WebRTC communication.

## Features

- **Session Management**: Create and join sessions for file sharing.
- **WebRTC Signaling**: Handles SDP offers, answers, and ICE candidates for peer-to-peer communication.
- **Redis Integration**: Stores session data for efficient management.
- **REST API**: Basic API endpoint for server health check.
- **Socket.io**: Real-time communication between clients.

## Folder Structure
```
.env
client.js
package.json
readme.md
server.js
config/
    db.confg.js
    redis.config.js
controllers/
    socket.controller.js
routes/
    index.route.js
utils/
    cors.util.js
```

## Prerequisites

- Node.js (v16 or higher)
- Redis server
- MongoDB (optional, for database integration)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/quickdrop-server.git
   cd quickdrop-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
    HOST=localhost
    PORT=3000

    #MONGO_URI=

    REDIS_USERNAME=default
    REDIS_HOST=localhost
    REDIS_PORT=6379
    REDIS_PASSWORD=
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

- **GET /**: Returns a welcome message.
  ```bash
  curl http://localhost:3000/
  ```

## WebSocket Events

### Client-Side Events

- **create-session**: Creates a new session.
- **join-session**: Joins an existing session.
- **webrtc-offer**: Sends an SDP offer to a peer.
- **webrtc-answer**: Sends an SDP answer to a peer.
- **webrtc-ice-candidate**: Sends ICE candidates to a peer.
- **transfer-status**: Updates the file transfer status.

### Server-Side Events

- **peer-connected**: Notifies peers when a new user joins the session.
- **peer-disconnected**: Notifies peers when a user disconnects.

## Development

- Use `nodemon` for hot-reloading during development:

  ```bash
  npm run start
  ```

## Dependencies

- `express`: Web framework for Node.js.
- `socket.io`: Real-time communication library.
- `redis`: Redis client for session management.
- `dotenv`: Environment variable management.
- `mongoose`: MongoDB object modeling (optional).

## License

This project is licensed under the ISC License.