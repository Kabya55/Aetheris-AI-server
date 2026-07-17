import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/auth';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }

  try {
    const auth = await getAuth();
    if (!auth) {
      res.status(500).json({ message: 'Authentication service is offline' });
      return;
    }

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      res.status(401).json({ message: 'Not authorized, invalid session' });
      return;
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role || 'user',
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, session validation failed' });
  }
}
