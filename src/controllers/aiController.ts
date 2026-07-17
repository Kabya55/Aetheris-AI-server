import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as geminiService from '../services/geminiService';
import { Chat } from '../models/Chat';

// 1. Generate Itinerary (AI Content Generator)
export async function generateItineraryHandler(req: AuthRequest, res: Response): Promise<void> {
  const { destination, duration, budget, style, pace } = req.body;

  if (!destination || !duration) {
    res.status(400).json({ message: 'Destination and Duration are required' });
    return;
  }

  try {
    const itinerary = await geminiService.generateItinerary({
      destination,
      duration: Number(duration),
      budget: budget || 'Moderate',
      style: style || 'Adventure',
      pace: pace || 'Moderate',
    });
    res.json({ itinerary });
  } catch (error: any) {
    console.error('Itinerary controller error:', error);
    res.status(500).json({ message: 'Failed to generate itinerary', error: error.message });
  }
}

// 2. Chat Agent (AI Chat Assistant with Conversation History & Memory)
export async function chatHandler(req: AuthRequest, res: Response): Promise<void> {
  const { message, conversationId = 'default-chat' } = req.body;

  if (!message) {
    res.status(400).json({ message: 'Message is required' });
    return;
  }

  const userId = req.user ? req.user.id : 'anonymous';

  try {
    // 1. Fetch conversation history for this conversation ID and user
    const chats = await Chat.find({ userId, conversationId }).sort({ createdAt: 1 }).limit(15);
    
    // Format history for Gemini API
    const geminiHistory = chats.map(c => ({
      role: c.role === 'user' ? 'user' as const : 'model' as const,
      parts: c.content,
    }));

    // 2. Save user message to database if user is authenticated
    if (req.user) {
      await Chat.create({
        userId,
        conversationId,
        role: 'user',
        content: message,
      });
    }

    // 3. Request AI response
    const { text, navigation } = await geminiService.getChatResponse(geminiHistory, message);

    // 4. Save assistant message to database if user is authenticated
    if (req.user) {
      await Chat.create({
        userId,
        conversationId,
        role: 'assistant',
        content: text,
      });
    }

    res.json({ text, navigation });
  } catch (error: any) {
    console.error('Chat controller error:', error);
    res.status(500).json({ message: 'Failed to complete chat agent request', error: error.message });
  }
}

// Fetch chat history for the current user and conversation
export async function getChatHistory(req: AuthRequest, res: Response): Promise<void> {
  const { conversationId = 'default-chat' } = req.params;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    res.json([]);
    return;
  }

  try {
    const chats = await Chat.find({ userId, conversationId }).sort({ createdAt: 1 });
    res.json(chats);
  } catch (error: any) {
    console.error('Fetch chat history error:', error);
    res.status(500).json({ message: 'Server error fetching chat history', error: error.message });
  }
}

// 3. Travel Expense Analyzer (AI Data Analyzer)
export async function analyzeExpensesHandler(req: AuthRequest, res: Response): Promise<void> {
  const { expensesData } = req.body;

  if (!expensesData) {
    res.status(400).json({ message: 'Expenses data payload is empty' });
    return;
  }

  try {
    const analysis = await geminiService.analyzeExpenses(expensesData);
    res.json(analysis);
  } catch (error: any) {
    console.error('Expense analysis controller error:', error);
    res.status(500).json({ message: 'Failed to analyze expenses', error: error.message });
  }
}

// 4. Booking Voucher Parser (AI Document Intelligence)
export async function parseVoucherHandler(req: AuthRequest, res: Response): Promise<void> {
  const { voucherText } = req.body;

  if (!voucherText) {
    res.status(400).json({ message: 'Voucher text content is empty' });
    return;
  }

  try {
    const parsedData = await geminiService.parseVoucher(voucherText);
    res.json(parsedData);
  } catch (error: any) {
    console.error('Voucher parser controller error:', error);
    res.status(500).json({ message: 'Failed to parse travel voucher', error: error.message });
  }
}

// 5. Auto Categorization (AI Auto Tagging & Labeling)
export async function autoTagHandler(req: AuthRequest, res: Response): Promise<void> {
  const { title, description } = req.body;

  if (!title || !description) {
    res.status(400).json({ message: 'Title and description are required for tag prediction' });
    return;
  }

  try {
    const tags = await geminiService.autoTagTrip(title, description);
    res.json({ tags });
  } catch (error: any) {
    console.error('Auto tag controller error:', error);
    res.status(500).json({ message: 'Failed to auto tag trip content', error: error.message });
  }
}
