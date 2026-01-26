import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, isWithinScope } from '@/lib/ai-client';
import { 
  getUserContext, 
  formatContextForAI, 
  extractOrderIntent,
  getOrderDetailsForAI 
} from '@/services/chatbot.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, userInfo, conversationHistory } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Check if user wants to create a ticket immediately
    const ticketKeywords = [
      'raise a support ticket', 'raise support ticket', 'create ticket', 'open ticket',
      'submit ticket', 'contact support', 'talk to support', 'speak to support',
      'real person', 'real agent', 'human agent', 'live agent',
      'contact agent', 'talk to agent', 'speak to agent',
      'talk to someone', 'speak to someone', 'human support'
    ];
    
    const lowerMessage = message.toLowerCase();
    const wantsTicket = ticketKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (wantsTicket) {
      return NextResponse.json({
        response: "I understand you'd like to speak with our support team. I'll open the ticket form for you right away. Please provide details about your issue, and our team will assist you as soon as possible.",
        suggestTicket: true,
        showTicketForm: true,
      });
    }

    // Check if message is within scope
    if (!isWithinScope(message)) {
      return NextResponse.json({
        response: "I apologize, but I can only help with questions about your account, orders, products, and collections. Is there something specific about your account or orders you'd like to know?",
        suggestTicket: false,
      });
    }

    // Get user context data
    const userContext = await getUserContext(userId);
    
    // Check for specific order intent
    const orderIntent = extractOrderIntent(message);
    let additionalContext = formatContextForAI(userContext);

    if (orderIntent.hasOrderIntent && orderIntent.orderNumber) {
      const orderDetails = await getOrderDetailsForAI(orderIntent.orderNumber);
      additionalContext += orderDetails;
    }

    // Build chat context with additional data
    const chatContext = {
      userInfo,
      conversationHistory: conversationHistory || [],
    };

    // Generate AI response with enhanced prompt
    const enhancedMessage = message + additionalContext;
    const aiResponse = await generateAIResponse(enhancedMessage, chatContext);

    // Determine if we should suggest raising a ticket
    const suggestTicket = 
      conversationHistory.length >= 6 || 
      message.toLowerCase().includes('problem') ||
      message.toLowerCase().includes('issue') ||
      message.toLowerCase().includes('help');

    return NextResponse.json({
      response: aiResponse,
      suggestTicket,
    });

  } catch (error: any) {
    console.error('[Chatbot API] Error:', error);
    
    // Return user-friendly error message
    const errorMessage = error.message || 'Failed to process your message. Please try again.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        suggestTicket: true, // Suggest ticket creation on errors
      },
      { status: 500 }
    );
  }
}
