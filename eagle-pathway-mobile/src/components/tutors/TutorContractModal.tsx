import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { Button } from '@/components/common';
import { DEFAULT_RESPONSIBILITIES_TEXT } from '@/services/tutorSessions';
import { toast } from '@/utils/toast';

interface TutorContractModalProps {
  visible: boolean;
  onClose: () => void;
  onSign: () => Promise<void>;
  roleName: 'Tutor' | 'Parent / Student';
  isSigned?: boolean;
  tutorName?: string;
  studentName?: string;
}

export function TutorContractModal({
  visible,
  onClose,
  onSign,
  roleName,
  isSigned = false,
  tutorName = 'Tutor',
  studentName = 'Parent/Student'
}: TutorContractModalProps) {
  const [agreed, setAgreed] = useState(isSigned);
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    if (!agreed) {
      toast.warning('Agreement Required', 'Please check the agreement box before signing.');
      return;
    }
    setLoading(true);
    try {
      await onSign();
      toast.success('Contract Signed! 📝', 'The tutoring responsibility agreement is active.');
      onClose();
    } catch (e: any) {
      toast.error('Signature Failed', e?.message || 'Could not save signature.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="document-text-outline" size={22} color={Colors.blue} />
              <Text style={styles.title}>Tutoring Agreement</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Subtitle Badge */}
          <View style={styles.partiesBadge}>
            <Text style={styles.partiesText}>
              📄 Parties: <Text style={{ fontWeight: 'bold', color: Colors.blue }}>{tutorName}</Text> (Tutor) & <Text style={{ fontWeight: 'bold', color: Colors.blue }}>{studentName}</Text> ({roleName})
            </Text>
          </View>

          {/* Document Content */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={true}>
            <Text style={styles.contractText}>{DEFAULT_RESPONSIBILITIES_TEXT}</Text>
          </ScrollView>

          {/* Signature Action Bar */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={agreed ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreed ? Colors.blue : Colors.textSecondary}
              />
              <Text style={styles.checkboxText}>
                I have read and agree to all terms as <Text style={{ fontWeight: 'bold' }}>{roleName}</Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={isSigned ? 'Contract Signed ✓' : `Sign as ${roleName}`}
              onPress={handleSign}
              loading={loading}
              disabled={isSigned || !agreed}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  partiesBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  partiesText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  scroll: {
    backgroundColor: '#FAFAFA',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
  },
  contractText: {
    fontSize: Typography.xs,
    color: Colors.text,
    lineHeight: 18,
  },
  footer: {
    gap: Spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkboxText: {
    fontSize: Typography.xs,
    color: Colors.text,
    flex: 1,
  },
});
