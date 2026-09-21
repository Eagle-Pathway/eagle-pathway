import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors, Typography, Radius, Spacing } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { toast } from '../../src/utils/toast';
import { CustomModal } from '../../src/components/common';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prompt: string;
  description?: string;
}

const ROLE_ACTIONS: Record<string, { badge: string; description: string; actions: QuickAction[] }> = {
  student: {
    badge: '🎓 Student Academic Guide',
    description: 'I can help you review SOPs, discover verified scholarships, prepare visa documents, and choose the right Eagle pathway.',
    actions: [
      { id: 's1', label: 'Review my SOP', icon: 'create-outline', prompt: 'Can you help review and polish my Statement of Purpose for international applications?' },
      { id: 's2', label: 'Find Scholarships', icon: 'school-outline', prompt: 'What are the best scholarships for Ethiopian students right now?' },
      { id: 's3', label: 'Document Help', icon: 'document-text-outline', prompt: 'Which documents do I need for a Master\'s or PhD application and visa?' },
      { id: 's4', label: 'Visa Guide', icon: 'globe-outline', prompt: 'How do I start the student visa process for Hungary or European universities?' },
      { id: 's5', label: 'Eagle Packages', icon: 'cash-outline', prompt: 'Tell me about the Standard and Premium mentorship packages on Eagle Pathway.' },
    ],
  },
  tutor: {
    badge: '🧑‍🏫 Tutor Teaching Coach',
    description: 'I can help you structure engaging lesson plans, draft practice quizzes, boost student engagement, and understand payout policies.',
    actions: [
      { id: 't1', label: 'Lesson Plan Builder', icon: 'book-outline', prompt: 'Help me structure an interactive 1-hour STEM tutoring lesson with review checkpoints.' },
      { id: 't2', label: 'Student Engagement', icon: 'sparkles-outline', prompt: 'What are proven techniques to keep high school students engaged during online tutoring?' },
      { id: 't3', label: 'Payout Policies', icon: 'wallet-outline', prompt: 'How do tutor payouts, session attendance confirmations, and rate structures work on Eagle Pathway?' },
      { id: 't4', label: 'Quiz Generator', icon: 'help-circle-outline', prompt: 'Help me draft a 5-question conceptual review quiz for Grade 11/12 Physics and Math.' },
      { id: 't5', label: 'Parent Update Template', icon: 'mail-outline', prompt: 'Help me write a concise, encouraging progress summary update for a student\'s parent.' },
    ],
  },
  parent: {
    badge: '👨‍👩‍👧 Family Academic Advisor',
    description: 'I can help you track your child\'s learning milestones, understand tutor screening, explore scholarship timelines, and pick packages.',
    actions: [
      { id: 'p1', label: 'Track Child\'s Progress', icon: 'stats-chart-outline', prompt: 'How can I monitor my child\'s academic growth and session history on Eagle Pathway?' },
      { id: 'p2', label: 'Tutor Vetting & Safety', icon: 'shield-checkmark-outline', prompt: 'How are Eagle Pathway tutors screened, verified, and supervised for quality?' },
      { id: 'p3', label: 'Scholarship Timelines', icon: 'calendar-outline', prompt: 'What critical scholarship and university application deadlines should our family prepare for?' },
      { id: 'p4', label: 'Packages & Tuition', icon: 'card-outline', prompt: 'What tutoring and mentorship package options are available for families?' },
      { id: 'p5', label: 'Success Stories', icon: 'trophy-outline', prompt: 'Share success stories of Ethiopian students who achieved full scholarships through Eagle Pathway.' },
    ],
  },
  admin: {
    badge: '⚡ Platform Operations Guide',
    description: 'Ecosystem navigation, applicant verification guidelines, and support tools.',
    actions: [
      { id: 'a1', label: 'Applicant Verification', icon: 'checkmark-done-circle-outline', prompt: 'What are the key criteria for verifying tutor and student documents?' },
      { id: 'a2', label: 'Workflows & Support', icon: 'layers-outline', prompt: 'Summarize the core tutoring booking and scholarship tracking workflows.' },
      { id: 'a3', label: 'Payment Policies', icon: 'receipt-outline', prompt: 'Explain the Ethiopian bank receipt verification and Telebirr confirmation rules.' },
    ],
  },
};

const ASSISTANT_API_URL = process.env.EXPO_PUBLIC_EAGLE_ASSISTANT_API_URL;
const SHARED_AI_API_URL = process.env.EXPO_PUBLIC_EAGLE_AI_API_URL;

function getAssistantApiUrl(): string {
  const rawUrl = ASSISTANT_API_URL || SHARED_AI_API_URL;
  if (!rawUrl) {
    throw new Error('Assistant endpoint is not configured.');
  }

  if (rawUrl.endsWith('/api/assistant')) {
    return rawUrl;
  }

  if (rawUrl.endsWith('/api/sop-review')) {
    return rawUrl.replace('/api/sop-review', '/api/assistant');
  }

  return `${rawUrl.replace(/\/$/, '')}/api/assistant`;
}

// Pulsing 3-dot thinking indicator
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 200);
    const anim3 = animateDot(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
    </View>
  );
}

export default function AssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const userRole = (user?.role?.toLowerCase() || 'student') as keyof typeof ROLE_ACTIONS;
  const roleConfig = ROLE_ACTIONS[userRole] || ROLE_ACTIONS.student;
  const firstName = user?.full_name ? user.full_name.trim().split(' ')[0] : 'there';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardOpen(true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const formatCurrentTime = () => {
    const date = new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessage = async (textOverride?: string) => {
    const messageText = (textOverride || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: messageText,
      timestamp: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
      const apiUrl = getAssistantApiUrl();
      const { data: { session } } = await supabase.auth.getSession();

      const payloadMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.content;
      
      if (content) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: content,
            timestamp: formatCurrentTime(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content: 'Sorry, I am currently unable to reach the AI server. Please verify your connection or try again in a moment.',
          timestamp: formatCurrentTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      toast.success('Copied to clipboard', 'Response text copied successfully.');
    } catch {
      toast.info('Notice', 'Could not copy message text.');
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setClearModalVisible(false);
    toast.info('Conversation Cleared', 'Started a fresh AI session.');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
        {!isUser && (
          <View style={styles.botIcon}>
            <Ionicons name="sparkles" size={14} color={Colors.white} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant]}>
          <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAssistant]}>
            {item.content || '...'}
          </Text>

          <View style={[styles.messageFooter, isUser ? styles.messageFooterUser : styles.messageFooterAssistant]}>
            <Text style={[styles.timestampText, isUser ? styles.timestampTextUser : styles.timestampTextAssistant]}>
              {item.timestamp}
            </Text>

            {!isUser && (
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopyMessage(item.content)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="copy-outline" size={13} color="#64748b" />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <TouchableOpacity 
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} 
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.headerBrandRow}>
            <Text style={styles.headerTitle}>Eagle AI Guide</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleConfig.badge.split(' ')[0]}</Text>
            </View>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText} numberOfLines={1}>{roleConfig.badge}</Text>
          </View>
        </View>

        {messages.length > 0 ? (
          <TouchableOpacity 
            onPress={() => setClearModalVisible(true)} 
            style={styles.headerBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.red} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>
      
      {/* Content + Input inside full-height KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          keyboardShouldPersistTaps="handled"
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.listContent, messages.length === 0 && styles.listContentEmpty]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyHeroCard}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="sparkles" size={32} color={Colors.blue} />
              </View>
              <Text style={styles.emptyGreeting}>Hi {firstName} 👋</Text>
              <Text style={styles.emptyTitle}>How can I assist your journey?</Text>
              <Text style={styles.emptyDescription}>{roleConfig.description}</Text>

              <View style={styles.quickStartersSection}>
                <Text style={styles.startersHeader}>Suggested for you</Text>
                <View style={styles.starterGrid}>
                  {roleConfig.actions.slice(0, 4).map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.starterCard}
                      onPress={() => sendMessage(action.prompt)}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <View style={styles.starterCardHeader}>
                        <View style={styles.starterIconCircle}>
                          <Ionicons name={action.icon} size={16} color={Colors.blue} />
                        </View>
                        <Ionicons name="arrow-forward" size={14} color="#94a3b8" />
                      </View>
                      <Text style={styles.starterCardTitle}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
          ListFooterComponent={
            isLoading ? (
              <View style={[styles.messageWrapper, styles.messageWrapperAssistant]}>
                <View style={styles.botIcon}>
                  <Ionicons name="sparkles" size={14} color={Colors.white} />
                </View>
                <View style={[styles.messageBubble, styles.messageBubbleAssistant, styles.typingBubble]}>
                  <TypingIndicator />
                </View>
              </View>
            ) : null
          }
        />

        {/* Floating Quick Actions Bar for active conversations */}
        {messages.length > 0 && (
          <View style={styles.quickActionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
              {roleConfig.actions.map((action) => (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.quickChip} 
                  onPress={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name={action.icon} size={14} color={Colors.blue} style={{ marginRight: 6 }} />
                  <Text style={styles.quickChipText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputContainer, { paddingBottom: isKeyboardOpen ? 10 : Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Ask Eagle AI (${roleConfig.badge.split(' ')[0]})...`}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Clear Chat Confirmation Modal */}
      <CustomModal
        visible={clearModalVisible}
        title="Clear Conversation?"
        message="This will remove the current messages and start a fresh AI session."
        icon="trash-outline"
        iconColor={Colors.red}
        iconBg={Colors.redLight}
        confirmText="Clear Chat"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleClearChat}
        onCancel={() => setClearModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: Typography.base + 1,
    fontWeight: Typography.bold,
    color: Colors.blueDark,
  },
  rolePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.blue,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: Typography.medium,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyHeroCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius['3xl'],
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 10,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emptyGreeting: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.blue,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.blueDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  quickStartersSection: {
    width: '100%',
    marginTop: 6,
  },
  startersHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  starterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  starterCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 74,
  },
  starterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  starterIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAssistant: {
    justifyContent: 'flex-start',
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.blueDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleUser: {
    backgroundColor: Colors.blue,
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 70,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.blue,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  messageTextUser: {
    color: Colors.white,
    fontWeight: '400',
  },
  messageTextAssistant: {
    color: '#1E293B',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  messageFooterUser: {
    justifyContent: 'flex-end',
  },
  messageFooterAssistant: {
    justifyContent: 'space-between',
  },
  timestampText: {
    fontSize: 10,
  },
  timestampTextUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampTextAssistant: {
    color: '#94A3B8',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.blue,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14.5,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
});
