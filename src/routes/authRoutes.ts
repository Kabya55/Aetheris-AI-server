import { Router, Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/auth';

const router = Router();

// Catch-all route to delegate to Better Auth node handler
router.all('*splat', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = await getAuth();
    if (!auth) {
      res.status(500).json({ message: 'Authentication service failed to initialize.' });
      return;
    }

    const { toNodeHandler } = await import('better-auth/node');
    const handler = toNodeHandler(auth);
    
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
