import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { scholarshipsService } from '@/services/scholarships';
import { interviewService, type AnswerFeedback } from '@/services/interview';
import { useAuthStore } from '@/store/authStore';
import type { Scholarship } from '@/types';

type Phase = 'intro' | 'interview' | 'done';

export function MockInterviewScreen() {
  const { scholarshipId } = useLocalSearchParams<{ scholarshipId?: string }>();
  const { user } = useAuthStore();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    if (scholarshipId) scholarshipsService.getScholarshipById(scholarshipId).then(setScholarship).catch(() => {});
  }, [scholarshipId]);

  const start = async () => {
    setLoadingQuestions(true);
    try {
      const qs = await interviewService.getQuestions(scholarship, user, 5);
      setQuestions(qs);
      setIndex(0);
      setScores([]);
      setAnswer('');
      setFeedback(null);
      setPhase('interview');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const getFeedback = async () => {
    if (!answer.trim()) return;
    setLoadingFeedback(true);
    try {
      const fb = await interviewService.getFeedback({
        question: questions[index],
        answer,
        scholarship,
        student: user,
      });
      setFeedback(fb);
      setScores(prev => [...prev, fb.score]);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const next = () => {
    setFeedback(null);
    setAnswer('');
    if (index + 1 >= questions.length) setPhase('done');
    else setIndex(index + 1);
  };

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>Mock Interview</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {phase === 'intro' && (
            <View>
              <Text style={s.heroEmoji}>🎤</Text>
              <Text style={s.h1}>Practice your interview</Text>
              <Text style={s.body}>
                {scholarship ? `Get ready for your ${scholarship.name} interview. ` : ''}
                We'll ask realistic questions, you answer in your own words, and you get instant feedback and tips after each one.
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={start} disabled={loadingQuestions} activeOpacity={0.85}>
                {loadingQuestions ? <ActivityIndicator color={Colors.white} /> : <Text style={s.primaryBtnText}>Start practice</Text>}
              </TouchableOpacity>
            </View>
          )}

          {phase === 'interview' && (
            <View>
              <Text style={s.progress}>Question {index + 1} of {questions.length}</Text>
              <View style={s.questionCard}>
                <Text style={s.questionText}>{questions[index]}</Text>
              </View>

              <TextInput
                style={s.answerInput}
                placeholder="Type your answer…"
                value={answer}
                onChangeText={setAnswer}
                multiline
                editable={!feedback}
                placeholderTextColor={Colors.textSecondary}
              />

              {!feedback ? (
                <TouchableOpacity style={[s.primaryBtn, (!answer.trim() || loadingFeedback) && { opacity: 0.6 }]} onPress={getFeedback} disabled={!answer.trim() || loadingFeedback} activeOpacity={0.85}>
                  {loadingFeedback ? <ActivityIndicator color={Colors.white} /> : <Text style={s.primaryBtnText}>Get feedback</Text>}
                </TouchableOpacity>
              ) : (
                <View>
                  <View style={s.feedbackCard}>
                    <View style={s.scoreRow}>
                      <Text style={s.scoreLabel}>Answer score</Text>
                      <Text style={[s.scoreValue, { color: feedback.score >= 75 ? Colors.green : feedback.score >= 55 ? Colors.goldDark : Colors.red }]}>{feedback.score}/100</Text>
                    </View>
                    <Text style={s.feedbackText}>{feedback.feedback}</Text>
                    {feedback.tips.map((tip, i) => (
                      <View key={i} style={s.tipRow}>
                        <Text style={s.tipBullet}>💡</Text>
                        <Text style={s.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={s.primaryBtn} onPress={next} activeOpacity={0.85}>
                    <Text style={s.primaryBtnText}>{index + 1 >= questions.length ? 'See summary' : 'Next question'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {phase === 'done' && (
            <View style={{ alignItems: 'center' }}>
              <Text style={s.heroEmoji}>🏆</Text>
              <Text style={s.h1}>Practice complete</Text>
              <View style={s.summaryScore}>
                <Text style={[s.summaryNum, { color: avg >= 75 ? Colors.green : avg >= 55 ? Colors.goldDark : Colors.red }]}>{avg}</Text>
                <Text style={s.summaryLbl}>average / 100 across {scores.length} answers</Text>
              </View>
              <Text style={[s.body, { textAlign: 'center' }]}>
                Keep practicing — strong interview answers are specific, structured, and tied to the scholarship's mission.
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={start} activeOpacity={0.85}>
                <Text style={s.primaryBtnText}>Practice again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.secondaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
                <Text style={s.secondaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, backgroundColor: Colors.grayLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  heroEmoji: { fontSize: 44, textAlign: 'center', marginBottom: Spacing.md },
  h1: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  body: { fontSize: Typography.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  progress: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.blue, marginBottom: Spacing.sm },
  questionCard: { backgroundColor: Colors.blueDark, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  questionText: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.white, lineHeight: 26 },
  answerInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, minHeight: 120, fontSize: Typography.md, textAlignVertical: 'top', marginBottom: Spacing.lg, color: Colors.text },
  primaryBtn: { backgroundColor: Colors.blue, borderRadius: Radius.lg, padding: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: Typography.md, fontWeight: Typography.bold },
  secondaryBtn: { padding: 14, alignItems: 'center', marginTop: Spacing.sm },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: Typography.md, fontWeight: Typography.semibold },
  feedbackCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  scoreLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreValue: { fontSize: Typography['2xl'], fontWeight: Typography.bold },
  feedbackText: { fontSize: Typography.md, color: Colors.text, lineHeight: 22, marginBottom: Spacing.md },
  tipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'flex-start' },
  tipBullet: { fontSize: 14 },
  tipText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  summaryScore: { alignItems: 'center', marginBottom: Spacing.xl },
  summaryNum: { fontSize: 56, fontWeight: Typography.bold },
  summaryLbl: { fontSize: Typography.sm, color: Colors.textSecondary },
});
