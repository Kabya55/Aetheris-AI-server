import mongoose from 'mongoose';

export let useMockDB = false;

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri || mongoUri.includes('আপনার_মঙ্গোডিবি_ইউআরএল_এখানে_দিন')) {
    console.error('ERROR: MONGO_URI is missing or placeholder. Server requires a database connection to operate.');
    process.exit(1);
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
