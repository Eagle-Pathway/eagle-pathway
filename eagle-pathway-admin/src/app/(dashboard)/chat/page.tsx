'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Search,
  Send,
  User,
  MoreVertical,
  CheckCheck,
  Loader2,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read?: boolean;
  created_at: string;
}

interface UserPreview {
  id: string;
  full_name: string;
  email: string;
  role: string;
  last_message?: string;
  last_time?: string;
  unread_count?: number;
}

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<UserPreview[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPreview | null>(null);
  const [selectedUserSetFromUrl, setSelectedUserSetFromUrl] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || selectedUserSetFromUrl || loading) return;

    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');

    if (userId) {
      setSelectedUserSetFromUrl(true);
      const existing = conversations.find(c => c.id === userId);
      if (existing) {
        handleSelectUser(existing);
      } else {
        const fetchUser = async () => {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .eq('id', userId)
            .single();
          if (!error && data) {
            const userPrev: UserPreview = {
              id: data.id,
              full_name: data.full_name,
              email: data.email,
              role: data.role || 'student',
              unread_count: 0
            };
            handleSelectUser(userPrev);
            setConversations(prev => [userPrev, ...prev]);
          }
        };
        fetchUser();
      }
    }
  }, [conversations, loading, selectedUserSetFromUrl]);

  const handleSelectUser = async (u: UserPreview) => {
    setSelectedUser(u);
    // Instantly clear unread count in conversations state
    setConversations(prev => prev.map(c => c.id === u.id ? { ...c, unread_count: 0 } : c));
    if (user?.id) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', u.id)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      window.dispatchEvent(new Event('chat_read_event'));
    }
  };

  useEffect(() => {
    fetchConversations();

    const subscription = supabase
      .channel('admin_messages_realtime')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        if (!payload) return;
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as ChatMessage;
          if (selectedUser && (newMsg.sender_id === selectedUser.id || newMsg.recipient_id === selectedUser.id)) {
            setMessages(prev => {
              // Deduplicate by ID or identical content & sender within close timestamp
              if (prev.some(m => m.id === newMsg.id || (m.sender_id === newMsg.sender_id && m.content === newMsg.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 4000))) {
                return prev.map(m => (m.sender_id === newMsg.sender_id && m.content === newMsg.content ? newMsg : m));
              }
              return [...prev, newMsg];
            });
            if (newMsg.sender_id === selectedUser.id && user?.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id)
                .then(() => window.dispatchEvent(new Event('chat_read_event')));
            }
          }
          fetchConversations();
        } else if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedUser, user]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: rawMessages, error } = await supabase
        .from('messages')
        .select('*, sender:users!messages_sender_id_fkey(id, full_name, email, role), recipient:users!messages_recipient_id_fkey(id, full_name, email, role)')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rawMessages) return;

      const userMap = new Map<string, UserPreview>();
      rawMessages.forEach((msg: any) => {
        const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender;
        if (!otherUser) return;
        if (!userMap.has(otherUser.id)) {
          // Count unread messages from this specific sender to user
          const unread = rawMessages.filter((m: any) => m.sender_id === otherUser.id && m.recipient_id === user.id && !m.is_read).length;
          userMap.set(otherUser.id, {
            ...otherUser,
            last_message: msg.content,
            last_time: msg.created_at,
            unread_count: unread
          });
        }
      });

      setConversations(Array.from(userMap.values()));
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser || !user) return;

    const content = inputText.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender_id: user.id,
      recipient_id: selectedUser.id,
      content,
      is_read: false,
      created_at: nowIso,
    };

    // 1. Immediately render in message stream
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');

    // 2. Immediately update or prepend conversation in sidebar
    setConversations(prev => {
      const exists = prev.some(c => c.id === selectedUser.id);
      if (exists) {
        return prev.map(c =>
          c.id === selectedUser.id
            ? { ...c, last_message: content, last_time: nowIso }
            : c
        );
      } else {
        return [{
          ...selectedUser,
          last_message: content,
          last_time: nowIso,
          unread_count: 0
        }, ...prev];
      }
    });

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            recipient_id: selectedUser.id,
            content,
            is_read: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Replace optimistic placeholder with real DB record
        setMessages(prev => prev.map(m => m.id === tempId ? (data as ChatMessage) : m));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Revert optimistic message and restore input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(content);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-4">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Direct Communications</p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Advising &amp; Support Messages</h1>
                <p className="mt-1 text-xs text-slate-500">Live communication channel with prospective students, applicants, and tutors.</p>
              </div>

              <div className="flex bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden h-[calc(100vh-210px)]">
                {/* Sidebar List */}
                <div className={`w-full md:w-80 border-r border-slate-200/80 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/40">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                      />
                    </div>
                  </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                              {loading && conversations.length === 0 ? (
                                <div className="flex items-center justify-center h-40">
                                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                </div>
                              ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-60 px-6 text-center">
                                  <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <MessageSquare className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <p className="text-xs font-semibold text-slate-900">No conversations</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">Direct student inquiries will appear here.</p>
                                </div>
                              ) : (
                                filteredConversations.map((conv) => (
                                  <button
                                    key={conv.id}
                                    onClick={() => handleSelectUser(conv)}
                                    className={`w-full p-3.5 flex items-center gap-3 hover:bg-slate-50/70 transition-colors text-left ${selectedUser?.id === conv.id ? 'bg-brand-blue/5 border-l-2 border-l-brand-blue' : ''}`}
                                  >
                                    <div className="relative shrink-0">
                                      <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
                                        <span className="text-amber-600 font-bold text-sm">{conv.full_name?.charAt(0)}</span>
                                      </div>
                                      {!!conv.unread_count && conv.unread_count > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs">
                                          {conv.unread_count}
                                        </span>
                                      )}
                                    </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-baseline mb-0.5">
                                            <p className={`text-xs truncate ${conv.unread_count ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{conv.full_name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{conv.last_time ? new Date(conv.last_time).toLocaleDateString() : ''}</p>
                                          </div>
                                          <p className={`text-[11px] truncate ${conv.unread_count ? 'font-medium text-slate-900' : 'text-slate-500'}`}>{conv.last_message || 'No messages yet'}</p>
                                          <span className="inline-block mt-1 px-1.5 py-0.2 bg-slate-100 text-[10px] font-semibold text-slate-600 rounded uppercase tracking-wider">
                                            {conv.role}
                                          </span>
                                          </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>

                                    {/* Chat Area */}
                                    <div className={`flex-1 flex flex-col bg-slate-50/30 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                                      {selectedUser ? (
                                        <>
                                          {/* Chat Header */}
                                          <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <button onClick={() => setSelectedUser(null)} className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                                                <ArrowLeft className="h-4 w-4" />
                                              </button>
                                              <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
                                                <span className="text-amber-600 font-bold text-xs">{selectedUser.full_name?.charAt(0)}</span>
                                              </div>
                                              <div>
                                                <h3 className="text-xs font-bold text-slate-900">{selectedUser.full_name}</h3>
                                                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                                                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Active
                                                </p>
                                              </div>
                                            </div>
                                              <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                                                {selectedUser.role}
                                              </div>
                                            </div>

                                                    {/* Messages body */}
                                                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
                                                      {messages.map((msg) => {
                                                        const isMine = msg.sender_id === user?.id;
                                                        return (
                                                          <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[70%]`}>
                                                              <div className={`p-3 rounded-xl text-xs ${isMine ? 'bg-slate-900 text-white rounded-br-xs' : 'bg-white border border-slate-200/80 text-slate-900 rounded-bl-xs shadow-xs'}`}>
                                                                {msg.content}
                                                              </div>
                                                              <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                                <span className="text-[10px] text-slate-400">
                                                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isMine && (
                                                                  <CheckCheck className={`h-3 w-3 ${msg.is_read ? 'text-brand-blue' : 'text-slate-300'}`} />
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                  );
                })}
                                                  <div ref={messagesEndRef} />
                                                </div>

                                                {/* Input Area */}
                                                <div className="p-3 bg-white border-t border-slate-200/80">
                                                  <form onSubmit={handleSendMessage} className="flex gap-2">
                                                    <input
                                                      type="text"
                                                      placeholder="Type your message..."
                                                      value={inputText}
                                                      onChange={(e) => setInputText(e.target.value)}
                                                      className="flex-1 bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                                                    />
                                                    <button
                                                      type="submit"
                                                      disabled={!inputText.trim()}
                                                      className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all disabled:opacity-40 text-xs font-semibold shadow-xs"
                                                    >
                                                      <Send className="h-4 w-4" />
                                                    </button>
                                                  </form>
                                                </div>
                                              </>
          ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                                              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                <MessageSquare className="h-6 w-6 text-slate-400" />
                                              </div>
                                              <h3 className="text-sm font-bold text-slate-900 mb-1">Select a conversation</h3>
                                              <p className="text-xs text-slate-500 max-w-xs">
                                                Select an applicant or student from the left panel to begin advising and support.
                                              </p>
                                            </div>
          )}
                                        </div>
                                    </div>
                                  </div>
                                  );
}
