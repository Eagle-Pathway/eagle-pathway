import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, EmptyState } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { successStoriesService, type SuccessStory } from '@/services/successStories';
import { getFlagEmoji } from '@eagle-pathway/shared';

export function SuccessStoriesScreen() {
  const { scholarshipName, country } = useLocalSearchParams<{ scholarshipName?: string; country?: string }>();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    successStoriesService
      .list({ scholarshipName, country })
      .then(setStories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [scholarshipName, country]);

  const subtitle = scholarshipName
    ? `Winners of ${scholarshipName}`
    : country
    ? `Students who made it to ${country}`
    : 'Real students, real scholarships';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Success Stories</Text>
          <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}><ListSkeleton count={4} /></View>
      ) : stories.length === 0 ? (
        <EmptyState
          icon="🏆"
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
                <View style={s.cardTop}>
                  <Avatar initials={initials} imageUri={item.avatar_url || undefined} size={44} borderRadius={13} />
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
                <Text style={s.quote}>“{item.quote}”</Text>
                {!!item.story && <Text style={s.story}>{item.story}</Text>}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, backgroundColor: Colors.grayLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  name: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  meta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  countryPill: { backgroundColor: Colors.blueLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  countryText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.blue },
  quote: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.text, lineHeight: 26, marginBottom: Spacing.sm },
  story: { fontSize: Typography.md, color: Colors.textSecondary, lineHeight: 22 },
});
