import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConversationManagerClass {
  constructor() {
    this.conversations = new Map();
  }

  async initialize() {
    await this.ensureConversationsDirectory();
    console.log('Conversation manager initialized');
  }

  async ensureConversationsDirectory() {
    const conversationsPath = path.join(__dirname, '../../conversations');
    try {
      await fs.access(conversationsPath);
    } catch {
      await fs.mkdir(conversationsPath, { recursive: true });
    }
  }

  createConversation() {
    const id = uuidv4();
    const conversation = {
      id,
      startTime: new Date(),
      endTime: null,
      messages: [],
      metadata: {
        visitorCount: 0,
        topics: []
      }
    };
    
    this.conversations.set(id, conversation);
    return id;
  }

  addMessage(conversationId, role, content) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages.push({
        role,
        content,
        timestamp: new Date()
      });
    }
  }

  async endConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.endTime = new Date();
      
      // Save to file
      const filename = `${conversation.id}_${Date.now()}.json`;
      const filepath = path.join(__dirname, '../../conversations', filename);
      
      try {
        await fs.writeFile(filepath, JSON.stringify(conversation, null, 2));
        console.log(`Conversation saved: ${filename}`);
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
      
      // Keep in memory for session
      return conversation;
    }
  }

  async getRecentConversations(limit = 10) {
    const conversationsPath = path.join(__dirname, '../../conversations');
    
    try {
      const files = await fs.readdir(conversationsPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const conversations = await Promise.all(
        jsonFiles.slice(-limit).map(async (filename) => {
          const filepath = path.join(conversationsPath, filename);
          const content = await fs.readFile(filepath, 'utf-8');
          return JSON.parse(content);
        })
      );
      
      return conversations.sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
    } catch (error) {
      console.error('Error reading conversations:', error);
      return [];
    }
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  extractTopics(conversation) {
    const topics = new Set();
    
    conversation.messages.forEach(msg => {
      if (typeof msg.content === 'string') {
        // Look for common museum topics
        const topicKeywords = [
          'ticket', 'cafe', 'shop', 'exhibit', 'train', 'bus', 
          'underground', 'tube', 'poster', 'children', 'family',
          'crowded', 'busy', 'quiet', 'staff', 'guide', 'display'
        ];
        
        topicKeywords.forEach(keyword => {
          if (msg.content.toLowerCase().includes(keyword)) {
            topics.add(keyword);
          }
        });
      }
    });
    
    return Array.from(topics);
  }
}

export const ConversationManager = new ConversationManagerClass();