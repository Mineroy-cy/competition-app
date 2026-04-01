const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || 'competition_app';
    const conn = await mongoose.connect(process.env.MONGO_URI, { dbName });
    console.log(`MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

module.exports = connectDB;
