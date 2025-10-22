import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2 md:gap-3 lg:gap-4 p-3 md:p-4 lg:p-6 ${isUser ? 'bg-transparent' : 'bg-slate-800/30'} animate-fade-in`}>
      <div className={`flex-shrink-0 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center ${
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
          : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
      }`}>
        {isUser ? <User className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" /> : <Bot className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" />}
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
