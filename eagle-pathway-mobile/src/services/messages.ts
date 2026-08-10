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
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        callback
      )
      .subscribe();
  },

  async getConversations(userId: string) {
    const { data, error } = await supabase.rpc('get_user_conversations', { 
      p_user_id: userId 
    });

    if (error) throw error;
    if (!data) return [];

    return data.map((conv: any) => ({
      id: conv.other_user_id,
      full_name: conv.full_name,
      avatar_url: conv.avatar_url,
      role: conv.active_role || conv.roles?.[0] || 'student',
      last_message: conv.last_message,
      last_time: conv.last_time,
      unread_count: parseInt(conv.unread_count)
    }));
  }
};
