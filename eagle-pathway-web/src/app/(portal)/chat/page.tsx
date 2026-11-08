'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  MessageSquare,
  Search,
  Send,
  User,
  CheckCheck,
  Clock,
  Sparkles,
  Phone,
  Video,
} from 'lucide-react';
import { formatDate } from '@/lib/date';

interface ChatConversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface MessageItem {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active conversations
  useEffect(() => {
    if (!user?.id) return;

    async function loadConversations() {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:users!sender_id(*), recipient:users!recipient_id(*)')
          .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const map = new Map<string, ChatConversation>();
        (data || []).forEach((msg: any) => {
          const isSender = msg.sender_id === user?.id;
          const partner = isSender ? msg.recipient : msg.sender;
          if (!partner?.id) return;

          if (!map.has(partner.id)) {
            map.set(partner.id, {
              id: partner.id,
              partnerId: partner.id,
              partnerName: partner.full_name || 'Academic Advisor',
              partnerRole: partner.role || 'tutor',
              avatarUrl: partner.avatar_url,
              lastMessage: msg.content,
              lastMessageTime: msg.created_at,
              unreadCount: !isSender && !msg.is_read ? 1 : 0,
            });
          }
        });

        const list = Array.from(map.values());
        setConversations(list);
        if (list.length > 0 && !activePartnerId) {
          setActivePartnerId(list[0].partnerId);
        }
      } catch (err) {
        console.warn('Load conversations error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [user?.id]);

  // Load messages for active partner
  useEffect(() => {
    if (!user?.id || !activePartnerId) return;

    async function loadThread() {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user?.id},recipient_id.eq.${activePartnerId}),and(sender_id.eq.${activePartnerId},recipient_id.eq.${user?.id})`
          )
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages((data as any) || []);

        // Mark as read
        if (user?.id) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', activePartnerId)
            .eq('recipient_id', user.id);
        }
      } catch (err) {
        console.warn('Load thread error:', err);
      }
    }

    loadThread();

    // Subscribe to new incoming messages
    const channel = supabase
      .channel(`chat-${user.id}-${activePartnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          if (
            (newMsg.sender_id === activePartnerId && newMsg.recipient_id === user.id) ||
            (newMsg.sender_id === user.id && newMsg.recipient_id === activePartnerId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user?.id || !activePartnerId) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: activePartnerId,
          content,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      setMessages((prev) => [...prev, data as any]);
    } catch (err) {
      console.warn('Send message error:', err);
      setInputText(content);
    }
  };

  const activePartner = conversations.find((c) => c.partnerId === activePartnerId);

  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row animate-in fade-in duration-200">
      {/* Left Column: Conversations List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200/80 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Direct Inbox</p>
              <h2 className="text-base font-bold text-slate-900">Messages</h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{conversations.length} Threads</span>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-900 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No Conversations Yet</p>
              <p className="text-[11px] text-slate-400">
                Book a tutor or message an academic advisor to begin chatting.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.partnerId === activePartnerId;
              return (
                <button
                  key={conv.partnerId}
                  onClick={() => setActivePartnerId(conv.partnerId)}
                  className={`w-full p-4 flex items-center gap-3.5 text-left transition-colors ${
                    isSelected ? 'bg-brand-blue/5 border-l-4 border-brand-blue' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/30 flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden">
                    {conv.avatarUrl ? (
                      <img
                        src={conv.avatarUrl}
                        alt={conv.partnerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      conv.partnerName.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs truncate ${isSelected ? 'font-bold text-brand-blue' : 'font-semibold text-slate-900'}`}>
                        {conv.partnerName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {conv.lastMessageTime
                          ? formatDate(new Date(conv.lastMessageTime), 'h:mm a')
                          : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Message Thread */}
      <div className="flex-1 flex flex-col bg-slate-50/40">
        {activePartnerId && activePartner ? (
          <>
            {/* Thread Header */}
            <div className="h-16 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/30 flex items-center justify-center font-bold text-xs">
                  {activePartner.avatarUrl ? (
                    <img
                      src={activePartner.avatarUrl}
                      alt={activePartner.partnerName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    activePartner.partnerName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activePartner.partnerName}
                  </h3>
                  <span className="text-[11px] text-slate-500 capitalize font-medium">
                    {activePartner.partnerRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-md ${isMine ? 'ml-auto items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isMine
                          ? 'bg-brand-blue text-white rounded-tr-none'
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                      {m.created_at ? formatDate(new Date(m.created_at), 'h:mm a') : ''}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200/80 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white disabled:opacity-40 transition-all shadow-xs flex items-center justify-center"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <MessageSquare size={44} className="text-slate-300" />
            <h3 className="text-base font-bold text-slate-900">Select a Conversation</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Choose a thread from the list on the left to review your chat history or send a direct message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
