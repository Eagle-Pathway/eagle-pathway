import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Linking, RefreshControl, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Radius, Spacing, CommonStyles } from '@/utils/theme';
import { Button, Pill, EmptyState, ErrorState, Skeleton } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { showError } from '@/utils/errorHandler';
import { useDocumentStore } from '@/store/documentStore';
import { Ionicons } from '@expo/vector-icons';
import type { DocumentType, Document } from '@/types';
import { withTimeout } from '@/utils/asyncUtils';

export function DocumentsScreen() {
  const { user } = useAuthStore();
  const { documents, loadDocuments, uploadDocument, deleteDocument } = useDocumentStore();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'identity' | 'other'>('all');
  const [error, setError] = useState(false);

  // Google Drive Link Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeType, setActiveType] = useState<DocumentType>('degree_certificate');
  const [activeLabel, setActiveLabel] = useState('Degree Certificate');
  const [cloudUrlInput, setCloudUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
  const docOfType = (type: DocumentType) => (documents || []).find(d => d.document_type === type);

  const DOC_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    degree_certificate: 'school-outline', transcript: 'clipboard-outline', passport: 'card-outline',
    cv: 'document-text-outline', ielts_certificate: 'ribbon-outline', reference_letter: 'mail-outline', 
    sop: 'create-outline', other: 'folder-outline',
  };

  const openInputModal = (type: DocumentType, label: string) => {
    const existing = docOfType(type);
    setActiveType(type);
    setActiveLabel(label);
    setCloudUrlInput(existing?.cloud_url || existing?.file_url || '');
    setModalVisible(true);
  };

  const handleSaveCredential = async () => {
    if (!user) return;
    const cleanUrl = cloudUrlInput.trim();

    if (!cleanUrl) {
      return toast.warning('Google Drive Link Required', 'Please paste a valid Google Drive shareable link.');
    }

    setSubmitting(true);
    try {
      await uploadDocument({
        userId: user.id,
        documentType: activeType,
        cloudUrl: cleanUrl,
        fileName: activeLabel,
      });
      setModalVisible(false);
      toast.success('Saved to Vault! 📁', `${activeLabel} Google Drive link attached.`);
      load();
    } catch (e: any) {
      showError(e, 'Failed to Save');
    } finally {
      setSubmitting(false);
    }
  };

  const openDoc = (doc: Document) => {
    if (doc.cloud_url || (doc.file_url && doc.file_url.startsWith('http'))) {
      const url = doc.cloud_url || doc.file_url;
      Linking.openURL(url).catch(() => toast.error('Error', 'Could not open link. Check URL format.'));
    } else if (doc.text_content) {
      Alert.alert(doc.file_name || 'Credential Details', doc.text_content);
    } else {
      toast.warning('Unavailable', 'This document has no link.');
    }
  };

  const confirmDelete = (doc: Document) => {
    Alert.alert('Remove from Vault?', doc.file_name || 'This credential', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc);
            toast.info('Removed', 'Document record removed.');
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
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={docStyles.title}>Document Vault</Text>
        <TouchableOpacity style={docStyles.mainUpload} onPress={() => openInputModal('other', 'Google Drive Document')} activeOpacity={0.8}>
          <Ionicons name="logo-google" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.blue} />}>
        {/* Info Banner for Google Drive */}
        <View style={docStyles.cloudBanner}>
          <Ionicons name="logo-google" size={22} color={Colors.blue} />
          <View style={{ flex: 1 }}>
            <Text style={docStyles.cloudBannerTitle}>Google Drive Document Vault</Text>
            <Text style={docStyles.cloudBannerSub}>Upload your documents to Google Drive, set sharing to "Anyone with the link can view", and paste the links below.</Text>
          </View>
        </View>

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
          <Text style={docStyles.sectionHint}>Tap any item to add its Google Drive link.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={docStyles.checklistScroll}>
            {CORE_DOCS.map(item => {
              const uploaded = hasDoc(item.type);
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[docStyles.checkItem, uploaded && docStyles.checkItemActive]}
                  activeOpacity={0.8}
                  onPress={() => openInputModal(item.type, item.label)}
                >
                  <Ionicons 
                    name={uploaded ? 'checkmark-circle' : 'logo-google'} 
                    size={18} 
                    color={uploaded ? Colors.green : Colors.blue} 
                  />
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
            <Ionicons name="folder-open-outline" size={48} color={Colors.textSecondary} style={{ marginBottom: 10 }} />
            <Text style={docStyles.emptyTitle}>No {selectedCategory} documents linked</Text>
            <Text style={docStyles.emptySub}>Add your Google Drive links to keep your applications ready.</Text>
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
                  <Ionicons 
                    name={DOC_ICONS[doc.document_type] || 'link-outline'} 
                    size={22} 
                    color={doc.status === 'approved' ? Colors.green : doc.status === 'rejected' ? Colors.red : Colors.blue} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={docStyles.docName} numberOfLines={1}>{doc.file_name || doc.document_type.replace(/_/g, ' ')}</Text>
                  <Text style={docStyles.docMeta}>
                    Google Drive Link · Tap to open
                  </Text>
                </View>
                <View style={[docStyles.statusPill, { backgroundColor: doc.status === 'approved' ? Colors.greenLight : doc.status === 'rejected' ? Colors.redLight : Colors.goldLight }]}>
                  <Text style={[docStyles.statusText, { color: doc.status === 'approved' ? Colors.green : doc.status === 'rejected' ? Colors.red : Colors.goldDark }]}>
                    {doc.status === 'approved' ? 'Verified' : doc.status === 'rejected' ? 'Review' : 'Pending'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Google Drive Link Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="logo-google" size={20} color={Colors.blue} />
                </View>
                <View>
                  <Text style={modalStyles.sheetTitle}>{activeLabel}</Text>
                  <Text style={{ fontSize: 11, color: Colors.blue, fontWeight: '600' }}>Google Drive Link</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Step-by-Step Guide */}
            <View style={{ backgroundColor: '#f0f9ff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#bae6fd', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0369a1', marginBottom: 6 }}>How to provide your link:</Text>
              <Text style={{ fontSize: 11, color: '#0c4a6e', marginBottom: 4 }}>1. Upload your <Text style={{ fontWeight: 'bold' }}>{activeLabel}</Text> (PDF / image) to Google Drive.</Text>
              <Text style={{ fontSize: 11, color: '#0c4a6e', marginBottom: 4 }}>2. In Google Drive, tap <Text style={{ fontWeight: 'bold' }}>Share</Text> → change access to <Text style={{ fontWeight: 'bold' }}>"Anyone with the link can view"</Text>.</Text>
              <Text style={{ fontSize: 11, color: '#0c4a6e' }}>3. Copy the link and paste it below.</Text>
            </View>

            <View style={modalStyles.inputWrap}>
              <Text style={modalStyles.fieldLabel}>Shareable Google Drive Link:</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="https://drive.google.com/file/d/..."
                placeholderTextColor={Colors.textSecondary}
                value={cloudUrlInput}
                onChangeText={setCloudUrlInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={modalStyles.btnRow}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={modalStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[modalStyles.saveBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleSaveCredential}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={modalStyles.saveBtnText}>Save Google Drive Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const docStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, backgroundColor: Colors.grayLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  mainUpload: { width: 44, height: 44, backgroundColor: Colors.blue, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  cloudBanner: { margin: Spacing.xl, marginBottom: 0, backgroundColor: Colors.blueLight, padding: Spacing.lg, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: Colors.blue + '30' },
  cloudBannerTitle: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.blueDark, marginBottom: 2 },
  cloudBannerSub: { fontSize: Typography.xs, color: Colors.blueDark, opacity: 0.8, lineHeight: 16 },
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

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: 36 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  tabRow: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.grayLight, padding: 4, borderRadius: Radius.lg, marginBottom: Spacing.lg },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.md },
  tabBtnActive: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.blue, fontWeight: Typography.bold },
  inputWrap: { marginBottom: Spacing.xl },
  fieldLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.text, marginBottom: 8 },
  input: { backgroundColor: Colors.grayLight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 14, fontSize: Typography.sm, color: Colors.text },
  textArea: { minHeight: 90 },
  tipText: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 8, lineHeight: 16 },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.grayLight },
  cancelBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.blue },
  saveBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.white },
});
