import { Request, Response, NextFunction } from 'express';
import { connectDB } from '../config/db';

export async function ensureDbConnected(req: Request, res: Response, next: NextFunction) {
  try {
    await connectDB();
    next();
  } catch (error: any) {
    console.error('CRITICAL: Database connection middleware failed:', error.message);
    res.status(503).json({
      message: 'Service Temporarily Unavailable',
      error: 'Database connection is not ready. Please retry.'
    });
  }
}
