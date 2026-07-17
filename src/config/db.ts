import mongoose from 'mongoose';

export let useMockDB = false;

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri || mongoUri.includes('আপনার_মঙ্গোডিবি_ইউআরএল_এখানে_দিন')) {
    throw new Error('MONGO_URI is missing or placeholder. Please configure MONGO_URI in your environment variables.');
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully to Aetheris database.');
  } catch (error) {
    console.error('CRITICAL: MongoDB connection failed:', error);
    // Let Mongoose handle reconnection attempts in the background
  }
}
