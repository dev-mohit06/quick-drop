const corsOptions = {
    origin: ["https://quick-drop-ten.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  };

module.exports = corsOptions;