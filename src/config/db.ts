import mongoose from 'mongoose';

export let useMockDB = false;

// Global cache to prevent multiple connections in serverless environments
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri || mongoUri.includes('আপনার_মঙ্গোডিবি_ইউআরএল_এখানে_দিন')) {
    throw new Error('MONGO_URI is missing or placeholder. Please configure MONGO_URI in your environment variables.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose command buffering to fail fast
    };

    console.log('Connecting to MongoDB Atlas (Serverless pattern)...');
    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully to Aetheris database.');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('CRITICAL: MongoDB connection failed:', error);
    throw error;
  }

  return cached.conn;
}
