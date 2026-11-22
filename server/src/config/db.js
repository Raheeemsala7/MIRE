const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGODB_URI, {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      })
      .then((conn) => {
        logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((err) => {
        cached.promise = null;
        logger.error(`Database connection failed: ${err.message}`);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    if (process.env.NODE_ENV !== 'test') {
      // Don't exit process in serverless so Vercel can return error JSON
      logger.error('Database connection failed, will retry on next request');
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection', error);
  }
};

module.exports = { connectDB, disconnectDB };
