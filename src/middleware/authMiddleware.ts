import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let sessionToken = '';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionToken = authHeader.split(' ')[1];
  } else {
    // Extract from cookies
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
      if (match) {
        sessionToken = match[1];
      }
    }
  }

  if (!sessionToken) {
    res.status(401).json({ message: 'Unauthorized: No session token found' });
    return;
  }

  sessionToken = decodeURIComponent(sessionToken);
  if (sessionToken.includes('.')) {
    sessionToken = sessionToken.split('.')[0];
  }

  try {
    const db = mongoose.connection.db;
    if (!db) {
      res.status(500).json({ message: 'Database connection not ready' });
      return;
    }

    // Find session directly in database
    const session = await db.collection('session').findOne({ token: sessionToken });

    if (!session || new Date() > new Date(session.expiresAt)) {
      res.status(401).json({ message: 'Unauthorized: Expired or invalid session' });
      return;
    }

    // Find user directly in database
    const userIdObj = typeof session.userId === 'string' ? new mongoose.Types.ObjectId(session.userId) : session.userId;
    const user = await db.collection('user').findOne({
      $or: [
        { _id: session.userId },
        { _id: userIdObj },
        { _id: session.userId.toString() }
      ]
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role || 'user',
    };
    next();
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
}
