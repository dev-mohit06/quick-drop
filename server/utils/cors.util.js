const corsOption = {
    origin: ["https://quick-drop-server-zeta.vercel.app/","http://localhost:3000"], // Change this to your actual frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true, // If using cookies or authentication
};

module.exports = corsOption;