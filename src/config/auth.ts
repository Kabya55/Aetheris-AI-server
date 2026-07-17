import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { MongoClient } from 'mongodb';

let auth: any = null;

const mongoUri = process.env.MONGO_URI;
if (mongoUri && !mongoUri.includes('আপনার_মঙ্গোডিবি_ইউআরএল_এখানে_দিন')) {
  try {
    const client = new MongoClient(mongoUri);
    // Connect client to db
    const db = client.db();
    
    auth = betterAuth({
      database: mongodbAdapter(db),
      emailAndPassword: {
        enabled: true,
        autoSignIn: true,
      },
      secret: process.env.BETTER_AUTH_SECRET || 'aetheris-super-secret-key-better-auth-1298473',
    });
    console.log('Better Auth instance initialized successfully with MongoDB.');
  } catch (err) {
    console.error('Failed to initialize Better Auth client instance:', err);
  }
}

export { auth };
