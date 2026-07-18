let authPromise: Promise<any> | null = null;
let authInstance: any = null;

export async function getAuth() {
  if (authInstance) return authInstance;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri || mongoUri.includes('আপনার_মঙ্গোডিবি_ইউআরএল_এখানে_দিন')) {
      console.warn('MONGO_URI is missing or placeholder. Skipping Better Auth initialization.');
      return null;
    }

    try {
      // Helper to dynamically import ESM modules from CommonJS without TS transpilation
      const importESM = (specifier: string) => new Function('specifier', 'return import(specifier)')(specifier);

      const { betterAuth } = await importESM('better-auth');
      const { mongodbAdapter } = await importESM('@better-auth/mongo-adapter');
      const { MongoClient } = await importESM('mongodb');
      const { bearer } = await importESM('better-auth/plugins/bearer');

      const client = new MongoClient(mongoUri);
      const db = client.db();
      
      authInstance = betterAuth({
        database: mongodbAdapter(db),
        emailAndPassword: {
          enabled: true,
          autoSignIn: true,
        },
        secret: process.env.BETTER_AUTH_SECRET || 'aetheris-super-secret-key-better-auth-1298473',
        plugins: [
          bearer()
        ]
      });
      console.log('Better Auth instance initialized successfully with MongoDB.');
      return authInstance;
    } catch (err) {
      console.error('Failed to initialize Better Auth client instance:', err);
      return null;
    }
  })();

  return authPromise;
}
