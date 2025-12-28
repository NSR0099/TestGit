require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");
        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        // precise check for users
        const users = collections.find(c => c.name.toLowerCase().includes('user') || c.name.toLowerCase().includes('admin'));
        if (users) {
            const User = mongoose.model(users.name, new mongoose.Schema({}, { strict: false }));
            const sample = await User.findOne();
            console.log("Sample User:", sample);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
