import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState } from '@/components/common';
import { scholarshipsService } from '@/services/scholarships';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import type { DocumentType } from '@/types';

export function DocumentsScreen() {
  const { user } = useAuthStore();
  const { documents, loadDocuments, uploadDocument } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'identity' | 'other'>('all');

  useEffect(() => {
    if (user) loadDocuments(user.id).finally(() => setLoading(false));
  }, [user?.id]);

  const CORE_DOCS: { type: DocumentType; label: string }[] = [
    { type: 'degree_certificate', label: 'Degree Certificate' },
    { type: 'transcript', label: 'Academic Transcript' },
    { type: 'passport', label: 'International Passport' },
    { type: 'cv', label: 'Curriculum Vitae (CV)' },
    { type: 'ielts_certificate', label: 'English Proficiency' },
    { type: 'reference_letter', label: 'Reference Letters' },
  ];

  const getCategory = (type: DocumentType): string => {
    if (['degree_certificate', 'transcript', 'ielts_certificate'].includes(type)) return 'academic';
    if (['passport', 'cv'].includes(type)) return 'identity';
    return 'other';
  };

  const filteredDocs = (documents || []).filter(d => 
    selectedCategory === 'all' || getCategory(d.document_type) === selectedCategory
  );

  const approved = documents.filter(d => d.status === 'approved').length;
  const pending = documents.filter(d => d.status === 'pending').length;
  
  const hasDoc = (type: DocumentType) => (documents || []).some(d => d.document_type === type);

  const DOC_EMOJIS: Record<string, string> = {
    degree_certificate: '🎓', transcript: '📋', passport: '🪪',
    cv: '📝', ielts_certificate: '📄', reference_letter: '✉️', 
    sop: '✍️', other: '📁',
  };

  const handleUpload = async () => {
    try {
      const result = await scholarshipsService.pickDocument();
      if (result.canceled || !result.assets?.[0] || !user) return;
      const asset = result.assets[0];
      await uploadDocument({ userId: user.id, documentType: 'other', fileUri: asset.uri, fileName: asset.name });
      Alert.alert('Success', 'Document uploaded!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={docStyles.header}>
        <TouchableOpacity style={docStyles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={docStyles.title}>Document Vault</Text>
        <TouchableOpacity style={docStyles.mainUpload} onPress={handleUpload} activeOpacity={0.8}>
          <Text style={docStyles.mainUploadText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={docStyles.statsRow}>
          <View style={docStyles.statBox}>
            <View style={[docStyles.dot, { backgroundColor: Colors.green }]} />
            <Text style={docStyles.statNum}>{approved}</Text>
            <Text style={docStyles.statLbl}>Verified</Text>
          </View>
          <View style={docStyles.statBox}>
            <View style={[docStyles.dot, { backgroundColor: Colors.orange }]} />
            <Text style={docStyles.statNum}>{pending}</Text>
            <Text style={docStyles.statLbl}>Review</Text>
          </View>
          <View style={docStyles.statBox}>
            <View style={[docStyles.dot, { backgroundColor: Colors.red }]} />
            <Text style={docStyles.statNum}>{CORE_DOCS.filter(c => !hasDoc(c.type)).length}</Text>
            <Text style={docStyles.statLbl}>Required</Text>
          </View>
        </View>

        <View style={docStyles.section}>
          <Text style={docStyles.sectionTitle}>Essential Checklist</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={docStyles.checklistScroll}>
            {CORE_DOCS.map(item => (
              <View key={item.type} style={[docStyles.checkItem, hasDoc(item.type) && docStyles.checkItemActive]}>
                <Text style={docStyles.checkIcon}>{hasDoc(item.type) ? '✅' : '🔴'}</Text>
                <Text style={[docStyles.checkLabel, hasDoc(item.type) && docStyles.checkLabelActive]}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={docStyles.filterRow}>
          {(['all', 'academic', 'identity', 'other'] as const).map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setSelectedCategory(cat)}
              style={[docStyles.filterBtn, selectedCategory === cat && docStyles.filterBtnActive]}
            >
              <Text style={[docStyles.filterText, selectedCategory === cat && docStyles.filterTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.blue} style={{ marginTop: 40 }} />
        ) : filteredDocs.length === 0 ? (
          <View style={docStyles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📂</Text>
            <Text style={docStyles.emptyTitle}>No {selectedCategory} documents</Text>
            <Text style={docStyles.emptySub}>Upload your files to keep your applications ready.</Text>
          </View>
        ) : (
          <View style={docStyles.docList}>
            {filteredDocs.map(doc => (
              <TouchableOpacity key={doc.id} style={docStyles.docItem} activeOpacity={0.9}>
                <View style={[docStyles.docIcon, { backgroundColor: doc.status === 'approved' ? Colors.greenLight : doc.status === 'rejected' ? Colors.redLight : Colors.blueLight }]}>
                  <Text style={{ fontSize: 18 }}>{DOC_EMOJIS[doc.document_type] || '📄'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={docStyles.docName} numberOfLines={1}>{doc.file_name}</Text>
                  <Text style={docStyles.docMeta}>
                    {doc.document_type.replace('_', ' ')} · {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                  </Text>
                </View>
                <View style={[docStyles.statusPill, { backgroundColor: doc.status === 'approved' ? Colors.greenLight : doc.status === 'rejected' ? Colors.redLight : Colors.goldLight }]}>
                  <Text style={[docStyles.statusText, { color: doc.status === 'approved' ? Colors.green : doc.status === 'rejected' ? Colors.red : Colors.goldDark }]}>
                    {doc.status === 'approved' ? 'Safe' : doc.status === 'rejected' ? 'Action' : 'Pending'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const docStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, backgroundColor: Colors.grayLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  mainUpload: { width: 44, height: 44, backgroundColor: Colors.blue, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  mainUploadText: { fontSize: 24, color: Colors.white, fontWeight: '300' },
  statsRow: { flexDirection: 'row', gap: Spacing.md, margin: Spacing.xl, marginBottom: Spacing.lg },
  statBox: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'flex-start', position: 'relative', overflow: 'hidden' },
  dot: { width: 6, height: 6, borderRadius: 3, marginBottom: 8 },
  statNum: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  statLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  checklistScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  checkItem: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 160 },
  checkItemActive: { borderColor: Colors.greenLight, backgroundColor: Colors.greenLight + '10' },
  checkIcon: { fontSize: 14 },
  checkLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.medium },
  checkLabelActive: { color: Colors.text, fontWeight: Typography.semibold },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: Colors.grayLight },
  filterBtnActive: { backgroundColor: Colors.blue },
  filterText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  docList: { paddingHorizontal: Spacing.xl },
  docItem: { marginBottom: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  docIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  docMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: Typography.bold, textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
