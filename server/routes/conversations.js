import express from 'express';
import { ConversationManager } from '../services/conversationManager.js';

const router = express.Router();

router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const conversations = await ConversationManager.getRecentConversations(limit);
    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const conversation = ConversationManager.getConversation(req.params.id);
    if (conversation) {
      res.json(conversation);
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.post('/:id/end', async (req, res) => {
  try {
    const conversation = await ConversationManager.endConversation(req.params.id);
    if (conversation) {
      res.json({ success: true, conversation });
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({ error: 'Failed to end conversation' });
  }
});

export default router;