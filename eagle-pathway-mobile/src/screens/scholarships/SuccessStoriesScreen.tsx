import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Modal, Linking, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, EmptyState, ErrorState } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { successStoriesService, type SuccessStory } from '@/services/successStories';
import { getFlagEmoji } from '@eagle-pathway/shared';
import { Ionicons } from '@expo/vector-icons';

export function SuccessStoriesScreen() {
  const { scholarshipName, country } = useLocalSearchParams<{ scholarshipName?: string; country?: string }>();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    successStoriesService
      .list({ scholarshipName, country })
      .then(setStories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [scholarshipName, country]);

  useEffect(() => { load(); }, [scholarshipName, country]);

  const handleOpenLink = async (url?: string | null) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url); // Attempt fallback
      }
    } catch {
      Alert.alert('Unable to open link', 'Please check your internet connection or install the required app.');
    }
  };

  const subtitle = scholarshipName
    ? `Winners of ${scholarshipName}`
    : country
    ? `Students who made it to ${country}`
    : 'Real students, real scholarships';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Success Stories 🏆</Text>
          <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
          <ListSkeleton count={4} />
        </View>
      ) : error && stories.length === 0 ? (
        <ErrorState subtitle="We couldn't load success stories. Check your connection and retry." onRetry={load} />
      ) : stories.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="No stories yet"
          subtitle={scholarshipName ? 'No stories for this scholarship yet — check back soon.' : 'Inspiring winner stories are on the way.'}
        />
      ) : (
        <FlatList
          data={stories}
          keyExtractor={st => st.id}
          contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const initials = item.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const flag = item.country_flag ? getFlagEmoji(item.country_flag) : '';

            return (
              <View style={s.card}>
                {/* Header */}
                <View style={s.cardTop}>
                  <Avatar initials={initials} imageUri={item.avatar_url || undefined} size={46} borderRadius={14} />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={s.name}>{item.student_name}</Text>
                    <Text style={s.meta}>
                      {item.scholarship_name}{item.year ? ` · ${item.year}` : ''}
                    </Text>
                  </View>
                  {!!item.country && (
                    <View style={s.countryPill}>
                      <Text style={s.countryText}>{flag} {item.country}</Text>
                    </View>
                  )}
                </View>

                {/* Quote */}
                <Text style={s.quote}>“{item.quote}”</Text>
                {!!item.story && <Text style={s.story}>{item.story}</Text>}

                {/* 1. Screenshot of DM */}
                {!!item.screenshot_url && (
                  <View style={s.mediaSection}>
                    <Text style={s.mediaLabel}>💬 Student DM / Acceptance Proof:</Text>
                    <TouchableOpacity
                      style={s.screenshotCard}
                      onPress={() => setSelectedScreenshot(item.screenshot_url || null)}
                      activeOpacity={0.88}
                    >
                      <Image
                        source={{ uri: item.screenshot_url }}
                        style={s.screenshotThumb}
                        resizeMode="cover"
                      />
                      <View style={s.screenshotOverlay}>
                        <Ionicons name="scan-outline" size={16} color={Colors.white} />
                        <Text style={s.screenshotOverlayText}>Tap to View Message</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 2. TikTok / Video Story Link */}
                {!!item.video_url && (
                  <TouchableOpacity
                    style={s.videoBtn}
                    onPress={() => handleOpenLink(item.video_url)}
                    activeOpacity={0.85}
                  >
                    <View style={s.videoIconWrap}>
                      <Ionicons name="play" size={16} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.videoBtnTitle}>Watch TikTok / Video Story</Text>
                      <Text style={s.videoBtnSub}>Hear directly from the winner</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color="#E11D48" />
                  </TouchableOpacity>
                )}

                {/* 3. Telegram Voice Message / Post Link */}
                {!!item.telegram_voice_url && (
                  <TouchableOpacity
                    style={s.telegramBtn}
                    onPress={() => handleOpenLink(item.telegram_voice_url)}
                    activeOpacity={0.85}
                  >
                    <View style={s.telegramIconWrap}>
                      <Ionicons name="mic" size={16} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.telegramBtnTitle}>Listen to Voice Note on Telegram</Text>
                      <Text style={s.telegramBtnSub}>Original student voice reflection</Text>
                    </View>
                    <Ionicons name="paper-plane" size={16} color="#0284C7" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Full-Screen Screenshot Modal */}
      <Modal
        visible={!!selectedScreenshot}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedScreenshot(null)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={s.modalCloseBtn}
            onPress={() => setSelectedScreenshot(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color={Colors.white} />
          </TouchableOpacity>

          {selectedScreenshot && (
            <Image
              source={{ uri: selectedScreenshot }}
              style={s.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.grayLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  meta: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countryPill: {
    backgroundColor: Colors.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countryText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.blue,
  },
  quote: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  story: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  mediaSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  mediaLabel: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  screenshotCard: {
    height: 140,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  screenshotThumb: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  screenshotOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  screenshotOverlayText: {
    fontSize: 11,
    fontWeight: Typography.semibold,
    color: Colors.white,
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  videoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBtnTitle: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: '#9F1239',
  },
  videoBtnSub: {
    fontSize: 11,
    color: '#BE123C',
    marginTop: 1,
  },
  telegramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  telegramIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telegramBtnTitle: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: '#075985',
  },
  telegramBtnSub: {
    fontSize: 11,
    color: '#0369A1',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
});
