'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  GraduationCap,
  BookOpen,
  FileText,
  Globe,
  Loader2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const PROMPT_PILLS = [
  {
    icon: FileText,
    label: 'Review SOP Structure',
    prompt: 'Can you help review and outline a winning Statement of Purpose (SOP) for international Master’s applications?',
  },
  {
    icon: GraduationCap,
    label: 'Find Full Scholarships',
    prompt: 'What are the top fully-funded scholarships available for Ethiopian students in Europe and North America right now?',
  },
  {
    icon: BookOpen,
    label: 'SAT Math Preparation',
    prompt: 'What are the best strategies and high-yield math formulas to score above 750 on SAT Math?',
  },
  {
    icon: Globe,
    label: 'European Student Visa',
    prompt: 'What documents are required to apply for a student visa for European universities like Germany and Hungary?',
  },
];

export default function AssistantPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        `Hello ${user?.full_name ? user.full_name.split(' ')[0] : 'there'}! 👋 I am **Eagle AI**, your dedicated academic counselor.\n\nI can assist you with:\n- **Scholarship Discovery**: Matching you with open international awards.\n- **SOP & Essay Guidance**: Structuring persuasive admissions essays.\n- **Tutoring Advice**: Recommending subject strategies for SAT, STEM, and IELTS.\n\nHow can I help you today? Select a prompt below or ask any question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overridePrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userRole: user?.role || 'student',
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply || data.content || 'I have analyzed your query and am here to assist further.';

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: 'I apologize, but I encountered a momentary connection hiccup. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear current conversation history?')) {
      setMessages([
        {
          id: `init-${Date.now()}`,
          role: 'assistant',
          content: 'Chat cleared. How else can I assist your educational journey?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B2A5B] to-[#1E4D9B] text-[#C9A84C] flex items-center justify-center shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Eagle AI Advisor</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-500 font-medium">
                Admissions, Essays &amp; Tutoring Assistant
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleClear}
          title="Clear Chat"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm ${isUser
                  ? 'bg-[#0B2A5B] text-white'
                  : 'bg-[#C9A84C]/15 text-[#9A7B2C] border border-[#C9A84C]/30'
                  }`}
              >
                {isUser ? <User size={16} /> : <Bot size={18} />}
              </div>

              <div
                className={`group relative rounded-2xl p-4.5 text-xs sm:text-sm leading-relaxed shadow-sm ${isUser
                  ? 'bg-[#0B2A5B] text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none whitespace-pre-line'
                  }`}
              >
                <div>{m.content}</div>

                <div
                  className={`flex items-center justify-between gap-3 mt-2 pt-1 text-[10px] ${isUser ? 'text-white/60' : 'text-slate-400'
                    }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-slate-700"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3.5 max-w-3xl">
            <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/15 text-[#9A7B2C] border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot size={18} />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Loader2 size={16} className="animate-spin text-[#C9A84C]" />
              <span>Eagle AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      {messages.length <= 2 && (
        <div className="px-6 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Suggestions:
          </span>
          {PROMPT_PILLS.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => handleSend(p.prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#0B2A5B]/40 hover:bg-slate-50 text-xs font-semibold text-slate-700 whitespace-nowrap transition-all shadow-2xs"
              >
                <Icon size={13} className="text-[#0B2A5B]" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Input Field */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#0B2A5B]/20 focus-within:border-[#0B2A5B] transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about scholarships, essays, exam preparation, or finding a tutor..."
            className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

