import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';

type AiInlineComment = {
  paragraph_index: number;
  quote: string;
  severity: 'strength' | 'suggestion' | 'critical';
  comment: string;
  suggested_revision?: string;
};

type AiSopReport = {
  score: number;
  feedback: string;
  suggestions: string[];
  inline_comments?: AiInlineComment[];
};

export default function SOPEditorScreen() {
  const { applicationId, scholarshipName } = useLocalSearchParams<{ applicationId: string, scholarshipName: string }>();
  const { user } = useAuthStore();
  const { applications, updateSOP, reviewSOP, isReviewingSOP } = useScholarshipStore();
  
  const application = applications.find(a => a.id === applicationId);
  const [content, setContent] = useState(application?.sop_content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState<AiSopReport | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  const handleSave = async () => {
    if (!applicationId) return;
    setIsSaving(true);
    try {
      await updateSOP(applicationId, content);
      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiReview = async () => {
    if (!content.trim()) return Alert.alert('Empty SOP', 'Please write something before requesting a review.');
    try {
      const result = await reviewSOP(content, application?.scholarship_id, user?.id);
      setAiReport(result);
      setShowAiModal(true);
    } catch (error) {
      Alert.alert('Error', 'AI service is currently busy. Please try again later.');
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>SOP Editor</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{scholarshipName || 'Your Application'}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator size="small" color={Colors.blue} /> : <Text style={styles.saveText}>Save Draft</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScreen contentContainerStyle={styles.scrollContent}>
        <View style={styles.editorWrap}>
          <View style={styles.toolbar}>
            <View style={styles.wordCountWrap}>
              <Text style={[styles.wordCount, wordCount < 500 && { color: Colors.orange }]}>
                {wordCount} words
              </Text>
              <Text style={styles.wordTarget}> (Target: 600-800)</Text>
            </View>
            <TouchableOpacity style={styles.aiButton} onPress={handleAiReview} disabled={isReviewingSOP}>
              {isReviewingSOP ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>✨</Text>
                  <Text style={styles.aiBtnText}>AI Review</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            multiline
            placeholder="Introduce yourself, your academic background, and why you are the perfect candidate for this scholarship..."
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 Eagle Advice</Text>
          <Text style={styles.tipsText}>
            Focus on your "Why". Explain how this specific scholarship connects your past achievements to your future goals in Ethiopia.
          </Text>
        </View>
      </KeyboardAwareScreen>

      {/* AI Report Modal */}
      <Modal visible={showAiModal} transparent animationType="slide" onRequestClose={() => setShowAiModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Eagle AI Audit</Text>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Text style={{ fontSize: 24, color: Colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.scoreCircleWrap}>
                <View style={[styles.scoreCircle, { borderColor: (aiReport?.score ?? 0) > 70 ? Colors.green : Colors.orange }]}>
                  <Text style={styles.scoreNum}>{aiReport?.score ?? 0}</Text>
                  <Text style={styles.scoreLabel}>Impact Score</Text>
                </View>
              </View>

              <Text style={styles.sectionHeading}>Overall Feedback</Text>
              <Text style={styles.feedbackText}>{aiReport?.feedback}</Text>

              {!!aiReport?.inline_comments?.length && (
                <>
                  <Text style={styles.sectionHeading}>Paragraph Comments</Text>
                  {aiReport.inline_comments.map((comment, i) => (
                    <View key={`${comment.paragraph_index}-${i}`} style={styles.inlineCommentCard}>
                      <View style={styles.inlineCommentHeader}>
                        <Text style={styles.inlineCommentLabel}>
                          Paragraph {comment.paragraph_index + 1}
                        </Text>
                        <Text style={[
                          styles.inlineSeverity,
                          comment.severity === 'critical' && styles.inlineSeverityCritical,
                          comment.severity === 'strength' && styles.inlineSeverityStrength,
                        ]}>
                          {comment.severity}
                        </Text>
                      </View>
                      {!!comment.quote && <Text style={styles.inlineQuote}>"{comment.quote}"</Text>}
                      <Text style={styles.inlineCommentText}>{comment.comment}</Text>
                      {!!comment.suggested_revision && (
                        <View style={styles.revisionBox}>
                          <Text style={styles.revisionLabel}>Suggested revision</Text>
                          <Text style={styles.revisionText}>{comment.suggested_revision}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.sectionHeading}>Actionable Suggestions</Text>
              {aiReport?.suggestions?.map((s: string, i: number) => (
                <View key={i} style={styles.suggestionRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.suggestionText}>{s}</Text>
                </View>
              ))}

              <TouchableOpacity 
                style={styles.closeModalBtn} 
                onPress={() => setShowAiModal(false)}
              >
                <Text style={styles.closeModalBtnText}>Got it, will improve!</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  headerSub: { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.blueLight },
  saveText: { color: Colors.blue, fontWeight: Typography.bold, fontSize: 13 },
  scrollContent: { padding: Spacing.xl },
  editorWrap: {
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 500,
    overflow: 'hidden'
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.bg
  },
  wordCountWrap: { flexDirection: 'row', alignItems: 'center' },
  wordCount: { fontSize: 12, fontWeight: Typography.bold, color: Colors.text },
  wordTarget: { fontSize: 11, color: Colors.textSecondary },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full
  },
  aiBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: 12 },
  input: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: Typography.md,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 400
  },
  tipsBox: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#e8d5a0'
  },
  tipsTitle: { fontWeight: 'bold', color: '#7a5c1e', marginBottom: 4 },
  tipsText: { fontSize: 13, color: '#9a7230', lineHeight: 20 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.xl,
    maxHeight: '85%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  scoreCircleWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  scoreCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreNum: { fontSize: 32, fontWeight: Typography.bold, color: Colors.text },
  scoreLabel: { fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase' },
  sectionHeading: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: Spacing.md },
  feedbackText: { fontSize: Typography.md, color: Colors.text, lineHeight: 24 },
  inlineCommentCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inlineCommentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  inlineCommentLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase' },
  inlineSeverity: { fontSize: 10, fontWeight: Typography.bold, color: Colors.blue, textTransform: 'uppercase' },
  inlineSeverityCritical: { color: Colors.red },
  inlineSeverityStrength: { color: Colors.green },
  inlineQuote: { fontSize: Typography.xs, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 6 },
  inlineCommentText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 20 },
  revisionBox: { marginTop: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  revisionLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: Typography.bold, textTransform: 'uppercase', marginBottom: 4 },
  revisionText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 20 },
  suggestionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  bullet: { fontSize: 20, color: Colors.blue, lineHeight: 24 },
  suggestionText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  closeModalBtn: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.xl
  },
  closeModalBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.base }
});
