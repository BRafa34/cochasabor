import { Router } from 'express';
import { postChatMessage } from '../controllers/chat-controller.js';
import { rateLimit } from '../middlewares/rate-limit.js';

export const chatRoutes = Router();
chatRoutes.post('/chat', rateLimit({ limit: 12, windowMs: 60 * 1000 }), postChatMessage);
