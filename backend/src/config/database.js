import mongoose from 'mongoose';
import config from './env.js';

let isConnected = false;
let connectionError = null;

/**
 * Connect to MongoDB using Mongoose
 * Never silently falls back to an in-memory database
 */
export async function connectDatabase() {
  if (!config.mongodbUri) {
    connectionError = 'MONGODB_URI is not configured';
    console.error(`[DATABASE] ${connectionError}`);
    return false;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      connectionError = null;
      console.log('[DATABASE] MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      connectionError = err.message;
      console.error('[DATABASE] MongoDB runtime connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[DATABASE] MongoDB disconnected.');
    });

    // Connect with a 5 second serverSelectionTimeoutMS so we fail fast and report status accurately
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    connectionError = null;
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.warn(`[DATABASE] Could not establish initial connection to MongoDB (${err.message}). Database features will report as disconnected.`);
    return false;
  }
}

/**
 * Returns current database connectivity status
 */
export function getDatabaseStatus() {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: states[readyState] || 'unknown',
    connected: readyState === 1,
    readyState,
    error: connectionError,
  };
}

export default {
  connectDatabase,
  getDatabaseStatus,
};
