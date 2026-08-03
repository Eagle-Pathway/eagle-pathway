import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { ProgressBar } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAuthStore } from '@/store/authStore';
import { COUNTRIES, FIELDS_OF_STUDY, validateAcademicScore } from '@eagle-pathway/shared';

export const ONBOARDED_KEY = '@eagle_onboarded';

const LEVELS = [
  { key: 'highschool', label: 'High School / Grade 12' },
  { key: 'undergraduate', label: 'Undergraduate' },
  { key: 'masters', label: "Master's" },
  { key: 'phd', label: 'PhD' },
];

const HIGH_SCHOOL_SCALES = [700, 600, 500];
const UNIVERSITY_SCALES = [4, 5, 100];

export function OnboardingScreen() {
  const { user, updateProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [level, setLevel] = useState<string>(user?.target_degree_level || '');
  const [gpa, setGpa] = useState<string>(user?.gpa != null ? String(user.gpa) : '');
  const [gpaMax, setGpaMax] = useState<number>(user?.gpa_max || (level === 'highschool' ? 700 : 4));
  const [interests, setInterests] = useState<string[]>(user?.interested_subjects || []);
  const [countries, setCountries] = useState<string[]>(user?.target_countries || []);
  const [hasIelts, setHasIelts] = useState<boolean>(!!user?.has_ielts);
  const [englishMedium, setEnglishMedium] = useState<boolean>(!!user?.is_english_medium);

  const scoreValidation = validateAcademicScore(gpa, gpaMax);

  const TOTAL = 4;

  const handleLevelSelect = (key: string) => {
    setLevel(key);
    // Auto-switch default scale based on study level
    if (key === 'highschool') {
      if (!HIGH_SCHOOL_SCALES.includes(gpaMax)) setGpaMax(700);
    } else {
      if (!UNIVERSITY_SCALES.includes(gpaMax)) setGpaMax(4);
    }
  };

  const [showAllCountries, setShowAllCountries] = useState(false);

  const toggleField = (field: string) => {
    if (field === 'Any Field') {
      setInterests(interests.includes('Any Field') ? [] : ['Any Field']);
      return;
    }
    const cleanList = interests.filter(i => i !== 'Any Field');
    setInterests(cleanList.includes(field) ? cleanList.filter(i => i !== field) : [...cleanList, field]);
  };

  const toggleCountry = (countryName: string) => {
    if (countryName === 'Any Location') {
      setCountries(countries.includes('Any Location') ? [] : ['Any Location']);
      return;
    }
    const cleanList = countries.filter(c => c !== 'Any Location');
    setCountries(cleanList.includes(countryName) ? cleanList.filter(c => c !== countryName) : [...cleanList, countryName]);
  };

  const finish = async (skip = false) => {
    if (!skip && gpa.trim() && !scoreValidation.isValid) return;

    setSaving(true);
    try {
      if (!skip) {
        const updates: Record<string, unknown> = {};
        if (level) {
          updates.target_degree_level = level;
          if (!user?.grade_level) updates.grade_level = level; // seed for matching
        }
        const gpaNum = parseFloat(gpa);
        if (!Number.isNaN(gpaNum) && scoreValidation.isValid) {
          updates.gpa = gpaNum;
          updates.gpa_max = gpaMax;
        }
        if (interests.length) updates.interested_subjects = interests;
        if (countries.length) updates.target_countries = countries;
        updates.has_ielts = hasIelts;
        updates.is_english_medium = englishMedium;
        if (Object.keys(updates).length) await updateProfile(updates as any);
      }
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      router.replace('/(tabs)/home');
    } catch {
      // Even if the save fails, don't trap the user — let them in.
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch(() => {});
      router.replace('/(tabs)/home');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentStepValid = step === 1 ? scoreValidation.isValid : true;

  const next = () => {
    if (!isCurrentStepValid) return;
    return (step + 1 >= TOTAL ? finish() : setStep(step + 1));
  };

  const availableScales = level === 'highschool' ? HIGH_SCHOOL_SCALES : UNIVERSITY_SCALES;

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.bg }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Text style={s.stepLabel}>Step {step + 1} of {TOTAL}</Text>
        <TouchableOpacity onPress={() => finish(true)} disabled={saving}><Text style={s.skip}>Skip</Text></TouchableOpacity>
      </View>
      <ProgressBar progress={((step + 1) / TOTAL) * 100} color={Colors.blue} height={6} style={{ marginHorizontal: Spacing.xl }} />

      <KeyboardAwareScreen contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 40 }}>
        {step === 0 && (
          <View>
            <Text style={s.h1}>What do you want to study?</Text>
            <Text style={s.sub}>Select your target degree level or current status.</Text>
            <View style={s.chips}>
              {LEVELS.map(l => (
                <TouchableOpacity key={l.key} style={[s.chip, level === l.key && s.chipActive]} onPress={() => handleLevelSelect(l.key)} activeOpacity={0.8}>
                  <Text style={[s.chipText, level === l.key && s.chipTextActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={s.h1}>
              {level === 'highschool' ? "Grade 12 / National Exam Score" : "What's your GPA?"}
            </Text>
            <Text style={s.sub}>
              {level === 'highschool'
                ? "Enter your Ethiopian Grade 12 Entrance Exam (EUEE) total score."
                : "Optional, but it sharpens your scholarship matches."}
            </Text>

            <TextInput
              style={[
                s.input,
                !scoreValidation.isValid && gpa.length > 0 && s.inputError
              ]}
              keyboardType="numeric"
              placeholder={level === 'highschool' ? "e.g. 560" : "e.g. 3.6"}
              value={gpa}
              onChangeText={setGpa}
              placeholderTextColor={Colors.textSecondary}
            />

            {!scoreValidation.isValid && gpa.length > 0 && (
              <Text style={s.errorText}>⚠️ {scoreValidation.error}</Text>
            )}

            {scoreValidation.isValid && gpa.length > 0 && scoreValidation.normalizedGpa != null && (
              <Text style={s.validHintText}>
                ✓ Equivalent to ~{scoreValidation.normalizedGpa.toFixed(2)} GPA on 4.0 scale
              </Text>
            )}

            <Text style={[s.label, { marginTop: Spacing.md }]}>Score Scale</Text>
            <View style={s.chips}>
              {availableScales.map(scale => (
                <TouchableOpacity key={scale} style={[s.chip, gpaMax === scale && s.chipActive]} onPress={() => setGpaMax(scale)} activeOpacity={0.8}>
                  <Text style={[s.chipText, gpaMax === scale && s.chipTextActive]}>
                    {scale > 5 ? `out of ${scale}` : scale === 100 ? 'out of 100%' : `out of ${scale}.0`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={s.h1}>What interests you?</Text>
            <Text style={s.sub}>Pick your fields and preferred destinations.</Text>
            <Text style={s.label}>Fields of study</Text>
            <View style={s.chips}>
              {FIELDS_OF_STUDY.map(f => {
                const isSelected = interests.includes(f);
                return (
                  <TouchableOpacity 
                    key={f} 
                    style={[s.chip, isSelected && s.chipActive]} 
                    onPress={() => toggleField(f)} 
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, isSelected && s.chipTextActive]}>
                      {f === 'Any Field' ? '💡 Any Field' : f}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.label, { marginTop: Spacing.lg }]}>Preferred countries</Text>
            <View style={s.chips}>
              <TouchableOpacity 
                style={[s.chip, countries.includes('Any Location') && s.chipActive]} 
                onPress={() => toggleCountry('Any Location')} 
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, countries.includes('Any Location') && s.chipTextActive]}>
                  🌍 Any Location / Open to All
                </Text>
              </TouchableOpacity>
              {(showAllCountries ? COUNTRIES : COUNTRIES.slice(0, 10)).map(c => {
                const isSelected = countries.includes(c.name);
                return (
                  <TouchableOpacity 
                    key={c.name} 
                    style={[s.chip, isSelected && s.chipActive]} 
                    onPress={() => toggleCountry(c.name)} 
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, isSelected && s.chipTextActive]}>
                      {c.flag} {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={s.showMoreBtn} 
              onPress={() => setShowAllCountries(!showAllCountries)}
              activeOpacity={0.8}
            >
              <Text style={s.showMoreText}>
                {showAllCountries ? '↑ Show Less' : `+ Show All Countries (${COUNTRIES.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={s.h1}>English proficiency</Text>
            <Text style={s.sub}>Many scholarships require this — it affects your eligibility.</Text>
            <TouchableOpacity style={[s.toggleRow, hasIelts && s.toggleRowActive]} onPress={() => setHasIelts(!hasIelts)} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>I have an IELTS / TOEFL score</Text>
                <Text style={s.toggleSub}>Or another recognized English test</Text>
              </View>
              <Text style={s.check}>{hasIelts ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleRow, englishMedium && s.toggleRowActive]} onPress={() => setEnglishMedium(!englishMedium)} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>I studied in English</Text>
                <Text style={s.toggleSub}>My instruction was English-medium</Text>
              </View>
              <Text style={s.check}>{englishMedium ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScreen>

      <View style={s.footer}>
        {step > 0 && (
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(step - 1)} disabled={saving} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            s.nextBtn,
            (!isCurrentStepValid || saving) && { opacity: 0.5 }
          ]}
          onPress={next}
          disabled={saving || !isCurrentStepValid}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={s.nextBtnText}>{step + 1 >= TOTAL ? 'Finish' : 'Continue'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  stepLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  skip: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.blue },
  h1: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  sub: { fontSize: Typography.md, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.xl, marginBottom: Spacing.xs, color: Colors.text },
  inputError: { borderColor: '#ef4444', borderWidth: 1.5, backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.md },
  validHintText: { color: '#16a34a', fontSize: Typography.sm, fontWeight: Typography.semibold, marginBottom: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  toggleRowActive: { borderColor: Colors.blue },
  toggleTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  toggleSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  check: { fontSize: 22 },
  footer: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.card },
  backBtn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: Radius.lg, backgroundColor: Colors.grayLight },
  backBtnText: { color: Colors.text, fontWeight: Typography.semibold, fontSize: Typography.md },
  nextBtn: { flex: 1, paddingVertical: 16, borderRadius: Radius.lg, backgroundColor: Colors.blue, alignItems: 'center' },
  nextBtnText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.md },
  showMoreBtn: { marginTop: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'flex-start' },
  showMoreText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.blue },
});

