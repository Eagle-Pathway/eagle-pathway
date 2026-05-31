import { create } from 'zustand';
import { messageService, Message } from '../services/messages';
import { supabase } from '../services/supabase';

interface ChatConversation {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  last_message: string;
  last_time: string;
  unread_count: number;
}

interface ChatState {
  conversations: ChatConversation[];
  activeMessages: Message[];
  activeRecipientId: string | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // Actions
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (userId: string, otherId: string) => Promise<void>;
  sendMessage: (senderId: string, recipientId: string, content: string, applicationId?: string) => Promise<void>;
  markAsRead: (userId: string, otherId: string) => Promise<void>;
  
  // Real-time
  subscribeToMessages: (userId: string) => () => void;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeMessages: [],
  activeRecipientId: null,
  isLoadingConversations: false,
  isLoadingMessages: false,

  loadConversations: async (userId: string) => {
    set({ isLoadingConversations: true });
    try {
      const conversations = await messageService.getConversations(userId);
      set({ conversations });
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  loadMessages: async (userId: string, otherId: string) => {
    set({ isLoadingMessages: true, activeRecipientId: otherId });
    try {
      const activeMessages = await messageService.getMessages(userId, otherId);
      set({ activeMessages });
      
      // Auto mark as read if viewing
      await messageService.markAsRead(otherId, userId);
      get().loadConversations(userId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (senderId: string, recipientId: string, content: string, applicationId?: string) => {
    try {
      const newMessage = await messageService.sendMessage(senderId, recipientId, content, applicationId);
      set((state) => ({
        activeMessages: [...state.activeMessages, newMessage],
        conversations: state.conversations.map(c => 
          c.id === recipientId 
            ? { ...c, last_message: content, last_time: newMessage.created_at } 
            : c
        )
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (userId: string, otherId: string) => {
    try {
      await messageService.markAsRead(otherId, userId);
      set((state) => ({
        conversations: state.conversations.map(c => 
          c.id === otherId ? { ...c, unread_count: 0 } : c
        )
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  addMessage: (message: Message) => {
    const { activeRecipientId, activeMessages, conversations } = get();
    
    // If message is from/to current active conversation, add to messages list
    if (message.sender_id === activeRecipientId || message.recipient_id === activeRecipientId) {
      set({ activeMessages: [...activeMessages, message] });
    }

    // Update conversation preview
    const otherUserId = message.sender_id === activeRecipientId ? message.sender_id : message.recipient_id;
    // (Simpler: just reload conversations for now to get fresh user details)
    // get().loadConversations(...) // Needs userId
  },

  subscribeToMessages: (userId: string) => {
    const subscription = supabase
      .channel(`user_messages_${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as Message;
          get().addMessage(newMsg);
          get().loadConversations(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}));
