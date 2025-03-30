const corsOption = {
    origin: ["https://quick-drop-ten.vercel.app","http://localhost:3000"],
    methods: "GET,POST,PUT,DELETE",
    credentials: true, // If using cookies or authentication
};

module.exports = corsOption;