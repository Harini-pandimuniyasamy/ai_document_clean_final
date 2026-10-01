import mongoose from 'mongoose';
import { User } from '../models/User';

let isConnecting = false;

/**
 * Connect to MongoDB Atlas using MONGODB_URI.
 * - Reuses existing connection across requests.
 * - Suitable for both local development and production MERN deployment.
 * - Never exposes credentials in logs or errors.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    const errMessage = 'MONGODB_URI environment variable is missing.';
    console.error(`[MongoDB] Configuration Error: ${errMessage}`);
    throw new Error(errMessage);
  }

  // If already connected, reuse connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If already connecting, wait for existing promise
  if (mongoose.connection.readyState === 2 || isConnecting) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve(mongoose));
      mongoose.connection.once('error', (err) => reject(err));
    });
  }

  isConnecting = true;

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    isConnecting = false;
    console.log(`[MongoDB] Connected successfully to database: "${mongoose.connection.name}"`);

    return conn;
  } catch (error: any) {
    isConnecting = false;
    console.error(`[MongoDB] Connection failed: ${error?.message || error}`);
    throw error;
  }
};


/**
 * Returns whether MongoDB connection is currently established (readyState === 1)
 */
export const isMongoConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Returns connection metadata (never exposes credentials)
 */
export const getMongoConnectionState = (): { readyState: number; status: string; dbName: string } => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;
  return {
    readyState: state,
    status: states[state] || 'disconnected',
    dbName: mongoose.connection.name || '',
  };
};

export default connectDB;
