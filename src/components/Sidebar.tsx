import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, LogOut, Sparkles, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Conversation } from '../lib/supabase';

interface SidebarProps {
  currentConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
}

export function Sidebar({ currentConversationId, onConversationSelect, onNewConversation }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (!error) {
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversationId === id) {
        onNewConversation();
      }
    }
  };

  const handleNewConversation = () => {
    onNewConversation();
    loadConversations();
    setIsOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    onConversationSelect(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 bg-slate-900 border-r border-slate-700/50 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Rafi.ai</h2>
              <p className="text-xs text-slate-400">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={handleNewConversation}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              No conversations yet.<br />Start a new chat!
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`
                  group p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3
                  ${currentConversationId === conv.id
                    ? 'bg-slate-800 ring-2 ring-blue-500/50'
                    : 'hover:bg-slate-800/50'
                  }
                `}
              >
                <MessageSquare className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{conv.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
