const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quickdrop';

const connectDB = async () => {

    console.log("\n🏁 Starting MongoDB connection...");

    try{
        console.log("🔗 Connecting to MongoDB...");

        const conn = await mongoose.connect(MONGO_URI,{
            autoIndex: false, // Disable for performance            
        });

        console.log(`🎉 MongoDB Connected: ${conn.connection.host}`);
    }catch(err){
        throw new Error(`MongoDB Connection Failed: ${err.message}`);
    }
}

module.exports = connectDB;