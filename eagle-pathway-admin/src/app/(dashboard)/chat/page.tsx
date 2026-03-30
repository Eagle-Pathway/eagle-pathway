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
  created_at: string;
}

interface UserPreview {
  id: string;
  full_name: string;
  email: string;
  role: string;
  last_message?: string;
  last_time?: string;
}

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<UserPreview[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    const subscription = supabase
      .channel('admin_messages')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (selectedUser && (newMsg.sender_id === selectedUser.id || newMsg.recipient_id === selectedUser.id)) {
          setMessages(prev => [...prev, newMsg]);
        }
        fetchConversations(); // Update previews
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedUser]);

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
    
    // Fetch unique users involved in messages
    const { data: rawMessages } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, email, role), recipient:users!messages_recipient_id_fkey(id, full_name, email, role)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!rawMessages) return;

    const userMap = new Map<string, UserPreview>();
    rawMessages.forEach((msg: any) => {
      const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender;
      if (!otherUser) return;
      if (!userMap.has(otherUser.id)) {
        userMap.set(otherUser.id, {
          ...otherUser,
          last_message: msg.content,
          last_time: msg.created_at
        });
      }
    });

    setConversations(Array.from(userMap.values()));
    setLoading(false);
  };

  const fetchMessages = async (otherId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser || !user) return;

    const content = inputText.trim();
    setInputText('');

    const { error } = await supabase
      .from('messages')
      .insert([
        { 
          sender_id: user.id, 
          recipient_id: selectedUser.id, 
          content 
        }
      ]);

    if (error) {
      console.error(error);
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
    <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-160px)] animate-in fade-in duration-500">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50/30">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 px-6 text-center">
               <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                 <MessageSquare className="h-6 w-6 text-gray-400" />
               </div>
               <p className="text-sm font-medium text-gray-900">No messages yet</p>
               <p className="text-xs text-gray-500 mt-1">Direct student inquiries will appear here.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedUser(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedUser?.id === conv.id ? 'bg-brand-blue/5 border-r-4 border-r-brand-blue' : ''}`}
              >
                <div className="h-12 w-12 bg-brand-blue/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-brand-blue font-bold text-lg">{conv.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-bold text-gray-900 truncate">{conv.full_name}</p>
                    <p className="text-[10px] text-gray-400">{conv.last_time ? new Date(conv.last_time).toLocaleDateString() : ''}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-600 rounded-full uppercase tracking-tighter">
                    {conv.role}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50/30 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 bg-brand-blue/10 rounded-full flex items-center justify-center">
                  <span className="text-brand-blue font-bold">{selectedUser.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedUser.full_name}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group`}>
                       <div className={`p-4 rounded-2xl text-sm ${isMine ? 'bg-brand-blue text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none shadow-sm'}`}>
                          {msg.content}
                       </div>
                       <div className={`flex items-center gap-2 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-gray-400">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && <CheckCheck className="h-3 w-3 text-brand-blue" />}
                       </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="h-12 w-12 bg-brand-blue text-white rounded-xl flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-md shadow-brand-blue/20"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="h-20 w-20 bg-brand-blue/5 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-brand-blue/30" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Connect with students and tutors in real-time to provide expert scholarship guidance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
