import { supabase } from './supabase';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  application_id?: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

export const messageService = {
  async getMessages(userId: string, otherId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  },

  async sendMessage(senderId: string, recipientId: string, content: string, applicationId?: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        { 
          sender_id: senderId, 
          recipient_id: recipientId, 
          content,
          application_id: applicationId 
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  },

  async markAsRead(senderId: string, recipientId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', recipientId)
      .eq('is_read', false);

    if (error) throw error;
  },

  subscribeToMessages(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user_messages_${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  async getConversations(userId: string) {
    // Fetch unique users involved in messages
    const { data: rawMessages, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, roles, active_role, avatar_url), recipient:users!messages_recipient_id_fkey(id, full_name, roles, active_role, avatar_url)')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!rawMessages) return [];

    const userMap = new Map<string, any>();
    rawMessages.forEach((msg: any) => {
      const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;
      if (!otherUser) return;
      const normalizedUser = {
        ...otherUser,
        role: otherUser.active_role || otherUser.roles?.[0] || 'student',
      };
      if (!userMap.has(otherUser.id)) {
        userMap.set(otherUser.id, {
          ...normalizedUser,
          last_message: msg.content,
          last_time: msg.created_at,
          unread_count: msg.recipient_id === userId && !msg.is_read ? 1 : 0
        });
      } else if (msg.recipient_id === userId && !msg.is_read) {
        const existing = userMap.get(otherUser.id);
        existing.unread_count += 1;
      }
    });

    return Array.from(userMap.values());
  }
};
