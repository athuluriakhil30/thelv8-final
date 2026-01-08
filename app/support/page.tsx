'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, Loader2, AlertCircle, Ticket, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generateSuggestions } from '@/lib/gemini-client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [suggestTicket, setSuggestTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    'What are my recent orders?',
    'Show me available collections',
    'Track my latest order',
    'What\'s my account status?',
  ]);

  // Ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState<string>('general');
  const [ticketPriority, setTicketPriority] = useState<string>('medium');

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to use the chatbot');
      router.push('/shop');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update suggestions based on conversation
    if (messages.length > 0) {
      const newSuggestions = generateSuggestions(messages);
      setSuggestions(newSuggestions);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectTicketRequest = (message: string): boolean => {
    const ticketKeywords = [
      'raise a support ticket',
      'raise support ticket',
      'create ticket',
      'open ticket',
      'submit ticket',
      'contact support',
      'talk to support',
      'speak to support',
      'real person',
      'real agent',
      'human agent',
      'live agent',
      'contact agent',
      'talk to agent',
      'speak to agent',
      'talk to someone',
      'speak to someone',
      'human support'
    ];
    
    const lowerMessage = message.toLowerCase();
    return ticketKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput('');

    // Check if user wants to create a ticket immediately
    if (detectTicketRequest(messageContent)) {
      setShowTicketForm(true);
      setSuggestTicket(false);
      
      // Add AI response acknowledging the ticket request
      const ticketMessage: Message = {
        role: 'assistant',
        content: '✅ Sure! I\'ve opened the support ticket form for you. Please fill in the details below, and our support team will get back to you as soon as possible.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, ticketMessage]);
      return; // Don't send to AI, just show the form
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user.id,
          userInfo: {
            email: user.email,
            fullName: user.user_metadata?.full_name,
            userId: user.id,
          },
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API error with user-friendly message
        const errorText = data.error || 'Failed to get response';
        throw new Error(errorText);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.suggestTicket) {
        setSuggestTicket(true);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Show user-friendly error notification
      const errorMsg = error.message || 'Failed to send message';
      toast.error(errorMsg, { duration: 5000 });
      
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: error.message.includes('high demand') || error.message.includes('rate limit')
          ? `⚠️ ${error.message}\n\nIn the meantime, feel free to browse our products or create a support ticket for personalized assistance.`
          : 'I apologize, but I encountered an error processing your request. Please try again in a moment, or create a support ticket for immediate assistance.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Suggest ticket on errors
      setSuggestTicket(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleCreateTicket = async () => {
    if (!user || !ticketSubject.trim() || !ticketDescription.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject: ticketSubject,
          description: ticketDescription,
          category: ticketCategory,
          priority: ticketPriority,
          chatContext: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      toast.success('Support ticket created successfully!');
      setShowTicketForm(false);
      setSuggestTicket(false);
      setTicketSubject('');
      setTicketDescription('');
      setTicketCategory('general');
      setTicketPriority('medium');

      // Add confirmation message
      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ Your support ticket has been created successfully! Our team will review it shortly. Your ticket ID is: ${data.ticket.id.substring(0, 8)}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(error.message || 'Failed to create ticket');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-stone-50">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-900">AI Assistant</h1>
          </div>
          <p className="text-lg text-stone-600">
            Ask me anything about your orders, collections, or account
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Bot className="w-16 h-16 text-stone-300 mb-4" />
                <h3 className="text-xl font-medium text-stone-900 mb-2">
                  Welcome to Your AI Assistant
                </h3>
                <p className="text-stone-600 mb-6 max-w-md">
                  I'm here to help you with your orders, track shipments, explore collections, and manage your account.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-3 bg-stone-50 hover:bg-stone-100 rounded-xl text-sm text-stone-700 transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-60 mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-stone-100 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips (when conversation exists) */}
          {messages.length > 0 && !isLoading && (
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 rounded-full text-xs text-stone-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Suggestion Banner */}
          {suggestTicket && !showTicketForm && (
            <div className="px-6 pb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-900 mb-2">
                    Having trouble? Our support team can provide personalized assistance.
                  </p>
                  <button
                    onClick={() => setShowTicketForm(true)}
                    className="text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                  >
                    Raise a Support Ticket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Form */}
          {showTicketForm && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Create Support Ticket</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Please provide detailed information about your issue"
                      rows={4}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Category
                      </label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="order">Order</option>
                        <option value="product">Product</option>
                        <option value="account">Account</option>
                        <option value="payment">Payment</option>
                        <option value="shipping">Shipping</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCreateTicket}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Submit Ticket
                    </button>
                    <button
                      onClick={() => setShowTicketForm(false)}
                      className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-stone-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-stone-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-stone-600">
          <p>
            💡 <strong>Tip:</strong> I can help you track orders, explore collections, and manage your account.
            {!showTicketForm && ' If I can\'t help, you can raise a support ticket.'}
          </p>
        </div>
      </div>
    </div>
  );
}
