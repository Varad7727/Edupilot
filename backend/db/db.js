const mongoose = require('mongoose')

const connectDB = async () => {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log("MongoDB connected!!!");
        })
        .catch((err) => {
            console.log("MongoDB connection error:", err);
        })
}

module.exports = connectDB;