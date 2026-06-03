const mongoose = require("mongoose");

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    // mongoose.connect returns a promise — we await it
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails  log the error and exit
    // We exit because without a database nothing works
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;