const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check both common variable naming conventions
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("Neither MONGO_URI nor MONGODB_URI is defined in your environment variables.");
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;