import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Sidebar } from './Sidebar';
import { supabase, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Menu } from 'lucide-react';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user?.id, title })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data.id;
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();

    if (error || !data) {
      console.error('Error saving message:', error);
      return null;
    }

    return data;
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    setLoading(true);

    let conversationId = currentConversationId;

    if (!conversationId) {
      conversationId = await createConversation(content);
      if (!conversationId) {
        setLoading(false);
        return;
      }
      setCurrentConversationId(conversationId);
    }

    const userMessage = await saveMessage(conversationId, 'user', content);
    if (userMessage) {
      setMessages(prev => [...prev, userMessage]);
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`;
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      console.log('Making request to:', apiUrl);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Conversation history:', conversationHistory);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: content,
          conversationHistory
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.response) {
        const assistantMessage = await saveMessage(conversationId, 'assistant', data.response);
        if (assistantMessage) {
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else if (data.error) {
        console.error('AI Error:', data.error);
      } else {
        console.error('No response from AI, data:', data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout - API call took too long');
        console.error('Request timeout - API call took too long');
      } else {
        console.error('Error sending message:', error);
        console.error('Error sending message:', error);
      }
    }

    setLoading(false);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleConversationSelect = (id: string) => {
    setCurrentConversationId(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-900 relative overflow-hidden">
      <Sidebar
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <div className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-2 md:p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 md:p-2 text-white hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg lg:text-xl font-bold text-white truncate">Rafi AI</h1>
              <p className="text-xs text-slate-400 hidden md:block">Always here to help</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-3 md:p-6">
              <div className="text-center max-w-2xl w-full">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl md:rounded-3xl mb-3 md:mb-4 lg:mb-6 shadow-2xl shadow-blue-500/50">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 md:mb-3 lg:mb-4">Welcome to Rafi.ai</h2>
                <p className="text-slate-400 text-sm md:text-base lg:text-lg mb-4 md:mb-6 lg:mb-8 px-2">
                  Your intelligent AI assistant. Ask me anything, and I'll do my best to help!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4 text-left">
                  {[
                    { title: 'Get Answers', desc: 'Ask questions and get detailed responses' },
                    { title: 'Creative Help', desc: 'Generate ideas, stories, and content' },
                    { title: 'Learn & Explore', desc: 'Discover new topics and concepts' },
                    { title: 'Problem Solving', desc: 'Get help with coding, math, and more' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg md:rounded-xl p-2.5 md:p-3 lg:p-4 hover:bg-slate-800 transition-all">
                      <h3 className="text-white font-semibold mb-1 text-xs md:text-sm lg:text-base">{item.title}</h3>
                      <p className="text-slate-400 text-xs md:text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-2 md:px-4 pb-2">
              {messages.map((message) => (
                <ChatMessage key={message.id} role={message.role} content={message.content} />
              ))}
              {loading && (
                <div className="flex gap-2 md:gap-3 lg:gap-4 p-3 md:p-4 lg:p-6 bg-slate-800/30 animate-fade-in">
                  <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-medium text-slate-300 mb-1">Rafi</div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
