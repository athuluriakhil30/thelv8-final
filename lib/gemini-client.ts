/**
 * Google Gemini AI Client
 * Handles communication with Google Gemini API for chatbot functionality
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const getGeminiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  return new GoogleGenerativeAI(apiKey);
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  userInfo?: {
    email?: string;
    fullName?: string;
    userId?: string;
  };
  conversationHistory: ChatMessage[];
}

/**
 * Generate AI response using Gemini with retry logic
 */
export async function generateAIResponse(
  userMessage: string,
  context: ChatContext
): Promise<string> {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Build context-aware prompt
      const systemPrompt = buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser Query: ${userMessage}\n\nAssistant:`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
      
    } catch (error: any) {
      console.error(`[GeminiClient] Attempt ${attempt}/${maxRetries} failed:`, error);
      
      // Check for specific error types
      const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('overloaded');
      const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
      
      // If it's a rate limit or overload error and we have retries left, wait and retry
      if ((is503 || is429) && attempt < maxRetries) {
        const waitTime = retryDelay * attempt; // Exponential backoff
        console.log(`[GeminiClient] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If we've exhausted retries or it's a different error, throw appropriate message
      if (is503) {
        throw new Error('The AI service is currently experiencing high demand. Please try again in a moment.');
      } else if (is429) {
        throw new Error('API rate limit reached. Please wait a moment before trying again.');
      } else if (error?.message?.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      } else {
        throw new Error('Unable to process your request at the moment. Please try again or create a support ticket.');
      }
    }
  }
  
  // This should never be reached, but just in case
  throw new Error('Maximum retry attempts exceeded. Please try again later.');
}

/**
 * Build system prompt with user context
 */
function buildSystemPrompt(context: ChatContext): string {
  const { userInfo, conversationHistory } = context;
  
  let prompt = `You are a helpful customer support assistant for an e-commerce fashion store called "TheLV8". 

Your role is to help users with:
- Account information and details
- Available product collections and categories
- Order status and tracking
- Order history and summaries
- Shipping and delivery information
- Product availability and stock questions

IMPORTANT GUIDELINES:
1. Be friendly, professional, and concise
2. Only answer questions related to the user's account, orders, products, and collections
3. If asked about topics outside your scope (like personal advice, unrelated products, or general knowledge), politely redirect to support topics
4. If you cannot fully resolve an issue, suggest that the user raise a support ticket
5. Always be honest if you don't have specific information - don't make up details
6. Format responses clearly with bullet points or numbered lists when appropriate
7. Keep responses under 150 words unless more detail is specifically requested

`;

  if (userInfo?.fullName) {
    prompt += `\nUser Information:\n- Name: ${userInfo.fullName}\n`;
  }
  if (userInfo?.email) {
    prompt += `- Email: ${userInfo.email}\n`;
  }

  if (conversationHistory.length > 0) {
    prompt += `\nConversation History:\n`;
    // Include last 3 messages for context
    const recentHistory = conversationHistory.slice(-3);
    recentHistory.forEach((msg) => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
  }

  return prompt;
}

/**
 * Validate if message is within chatbot scope
 */
export function isWithinScope(message: string): boolean {
  const scopeKeywords = [
    'order', 'orders', 'account', 'collection', 'collections',
    'product', 'products', 'shipping', 'delivery', 'track',
    'status', 'return', 'refund', 'payment', 'address',
    'profile', 'email', 'phone', 'password', 'cart',
    'wishlist', 'size', 'color', 'stock', 'available'
  ];

  const lowerMessage = message.toLowerCase();
  return scopeKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Generate smart suggestions based on conversation
 */
export function generateSuggestions(
  conversationHistory: ChatMessage[]
): string[] {
  const defaultSuggestions = [
    'What are my recent orders?',
    'Show me available collections',
    'Track my latest order',
    'What\'s my account status?',
  ];

  // If conversation is empty, return defaults
  if (conversationHistory.length === 0) {
    return defaultSuggestions;
  }

  // Return contextual suggestions based on last message
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  
  if (lastMessage.content.toLowerCase().includes('order')) {
    return [
      'Get order details',
      'Track my shipment',
      'Change delivery address',
      'Cancel my order',
    ];
  }

  if (lastMessage.content.toLowerCase().includes('collection')) {
    return [
      'Show me new arrivals',
      'What\'s in the latest collection?',
      'Browse by category',
      'Any sale items?',
    ];
  }

  return defaultSuggestions;
}
