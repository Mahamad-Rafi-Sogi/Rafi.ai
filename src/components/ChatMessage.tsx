import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 md:gap-4 p-4 md:p-6 ${isUser ? 'bg-transparent' : 'bg-slate-800/30'} animate-fade-in`}>
      <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center ${
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
          : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
      }`}>
        {isUser ? <User className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs md:text-sm font-medium text-slate-300 mb-1">
          {isUser ? 'You' : 'Rafi'}
        </div>
        <div className="text-slate-100 whitespace-pre-wrap break-words leading-relaxed text-sm md:text-base">
          {content}
        </div>
      </div>
    </div>
  );
}
