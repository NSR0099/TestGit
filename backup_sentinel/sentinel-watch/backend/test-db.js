require('dotenv').config();
const mongoose = require('mongoose');

console.log("Testing MongoDB connection...");
console.log("URI:", process.env.MONGODB_URI ? "Found" : "Missing");

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("SUCCESS: Connected to MongoDB!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("FAILURE: Connection error:", err.message);
        process.exit(1);
    });
