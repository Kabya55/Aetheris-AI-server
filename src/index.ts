import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('[DNS] Programmatically set DNS servers to Google Public DNS.');
} catch (error: any) {
  console.warn('[DNS] Warning: Failed to override DNS servers:', error.message);
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import tripRoutes from './routes/tripRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || origin.startsWith('http://localhost') || origin.endsWith('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['set-auth-token']
}));
app.use(express.json());

// Routes
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Aetheris Agentic AI Backend API is running smoothly.');
});

// Bootstrapping function
async function bootstrap() {
  // Connect database
  await connectDB();

  // Start Express Server
  if (!process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`[Aetheris App Server] Listening at http://localhost:${port}`);
    });
  }
}

// On Vercel, connect database immediately during cold start
if (process.env.VERCEL) {
  connectDB().catch(error => {
    console.error('Database connection failed on Vercel:', error);
  });
} else {
  bootstrap().catch(error => {
    console.error('Bootstrap failure:', error);
  });
}

export default app;
