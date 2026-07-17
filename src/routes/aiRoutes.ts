import { Router } from 'express';
import {
  generateItineraryHandler,
  chatHandler,
  getChatHistory,
  analyzeExpensesHandler,
  parseVoucherHandler,
  autoTagHandler,
} from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Make them optional protect by using a custom softProtect middleware or letting controllers check req.user
const softProtect = (req: any, res: any, next: any) => {
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'aetheris-super-secret-key-1298473';
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Ignore invalid token, proceed anonymously
    }
  }
  next();
};

router.post('/generate-itinerary', generateItineraryHandler as any);
router.post('/chat', softProtect, chatHandler as any);
router.get('/chat/history/:conversationId', protect as any, getChatHistory as any);
router.post('/analyze-expenses', analyzeExpensesHandler as any);
router.post('/parse-voucher', parseVoucherHandler as any);
router.post('/auto-tag', autoTagHandler as any);

export default router;
