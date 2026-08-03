import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Linking, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Radius, Spacing, CommonStyles } from '@/utils/theme';
import { Button, Pill, EmptyState, ErrorState, Skeleton, ScaleBounce } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@/utils/errorHandler';
import { useDocumentStore } from '@/store/documentStore';
import { scholarshipsService } from '@/services/scholarships';
import type { DocumentType, Document } from '@/types';

import { withTimeout } from '@/utils/asyncUtils';

export function DocumentsScreen() {
  const { user } = useAuthStore();
  const { documents, loadDocuments, uploadDocument, deleteDocument } = useDocumentStore();
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'identity' | 'other'>('all');
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try { await withTimeout(loadDocuments(user.id), 3500); } catch { setError(true); } finally { setLoading(false); }
  }, [user?.id, loadDocuments]);

  useEffect(() => { load(); }, [user?.id]);

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

  const approved = (documents || []).filter(d => d.status === 'approved').length;
  const pending = (documents || []).filter(d => d.status === 'pending').length;
  
  const hasDoc = (type: DocumentType) => (documents || []).some(d => d.document_type === type);

  const DOC_EMOJIS: Record<string, string> = {
    degree_certificate: '🎓', transcript: '📋', passport: '🪪',
    cv: '📝', ielts_certificate: '📄', reference_letter: '✉️', 
    sop: '✍️', other: '📁',
  };

  const docOfType = (type: DocumentType) => (documents || []).find(d => d.document_type === type);

  // Upload a file tagged with a specific type, so the checklist + categories
  // are accurate (previously every upload was saved as "other").
  const handleUploadType = async (type: DocumentType) => {
    if (!user || uploadingType) return;
    try {
      const result = await scholarshipsService.pickDocument();
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploadingType(type);
      await uploadDocument({ userId: user.id, documentType: type, fileUri: asset.uri, fileName: asset.name });
      Alert.alert('Uploaded', 'Your document was added to the vault.');
    } catch (e: any) {
      showError(e, 'Upload Failed');
    } finally {
      setUploadingType(null);
    }
  };

  const openDoc = (doc: Document) => {
    if (!doc.file_url) return Alert.alert('Unavailable', 'This document has no preview link.');
    Linking.openURL(doc.file_url).catch(() => Alert.alert('Error', 'Could not open this document.'));
  };

  const confirmDelete = (doc: Document) => {
    Alert.alert('Delete document?', doc.file_name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc);
          } catch (e: any) {
            showError(e, 'Failed to Delete');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={docStyles.header}>
        <TouchableOpacity style={docStyles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={docStyles.title}>Document Vault</Text>
        <TouchableOpacity style={docStyles.mainUpload} onPress={() => handleUploadType('other')} activeOpacity={0.8}>
          <Text style={docStyles.mainUploadText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.blue} />}>
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
          <Text style={docStyles.sectionHint}>Tap to {''}upload — or view a document you've already added.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={docStyles.checklistScroll}>
            {CORE_DOCS.map(item => {
              const uploaded = hasDoc(item.type);
              const isUploading = uploadingType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[docStyles.checkItem, uploaded && docStyles.checkItemActive]}
                  activeOpacity={0.8}
                  disabled={isUploading}
                  onPress={() => {
                    const existing = docOfType(item.type);
                    if (existing) openDoc(existing);
                    else handleUploadType(item.type);
                  }}
                >
                  <Text style={docStyles.checkIcon}>{isUploading ? '⏳' : uploaded ? '✅' : '⬆️'}</Text>
                  <Text style={[docStyles.checkLabel, uploaded && docStyles.checkLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
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
          <View style={docStyles.docList}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={docStyles.docItem}>
                <Skeleton width={48} height={48} style={{ borderRadius: 14 }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="60%" height={16} style={{ borderRadius: 4 }} />
                  <Skeleton width="40%" height={12} style={{ borderRadius: 4 }} />
                </View>
                <Skeleton width={50} height={24} style={{ borderRadius: 8 }} />
              </View>
            ))}
          </View>
        ) : error && (documents || []).length === 0 ? (
          <ErrorState subtitle="We couldn't load your documents. Check your connection and retry." onRetry={load} />
        ) : filteredDocs.length === 0 ? (
          <View style={docStyles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📂</Text>
            <Text style={docStyles.emptyTitle}>No {selectedCategory} documents</Text>
            <Text style={docStyles.emptySub}>Upload your files to keep your applications ready.</Text>
          </View>
        ) : (
          <View style={docStyles.docList}>
            {filteredDocs.map(doc => (
              <TouchableOpacity
                key={doc.id}
                style={docStyles.docItem}
                activeOpacity={0.9}
                onPress={() => openDoc(doc)}
                onLongPress={() => confirmDelete(doc)}
              >
                <View style={[docStyles.docIcon, { backgroundColor: doc.status === 'approved' ? Colors.greenLight : doc.status === 'rejected' ? Colors.redLight : Colors.blueLight }]}>
                  <Text style={{ fontSize: 18 }}>{DOC_EMOJIS[doc.document_type] || '📄'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={docStyles.docName} numberOfLines={1}>{doc.file_name}</Text>
                  <Text style={docStyles.docMeta}>
                    {doc.document_type.replace(/_/g, ' ')} · {(doc.file_size / 1024 / 1024).toFixed(1)} MB · Tap to view
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
  sectionHint: { fontSize: Typography.xs, color: Colors.textSecondary, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm },
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
