const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Read from process.env with direct string fallback for local development
    const uri = process.env.MONGODB_URI || 'mongodb+srv://karthikpanicker9999_db_user:5lmiNiE8ZIMUdrEK@cluster0.qldjn0x.mongodb.net/crc_db?retryWrites=true&w=majority&appName=Cluster0';

    if (!uri) {
      throw new Error("MONGODB_URI environment variable is missing.");
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;