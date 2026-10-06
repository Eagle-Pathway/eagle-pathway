import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '../../utils/theme';
import { rateAppService } from '../../utils/rateApp';

export interface RateAppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const RateAppModal: React.FC<RateAppModalProps> = ({
  visible,
  onClose,
  title = 'Enjoying Eagle Pathway? ⭐',
  subtitle = 'Your 5-star review on Google Play helps other students discover life-changing scholarships and expert tutoring.',
}) => {
  if (!visible) return null;

  const handleRate = async () => {
    await rateAppService.markRated();
    onClose();
    await rateAppService.openPlayStore();
  };

  const handleRemindLater = async () => {
    await rateAppService.markRemindLater();
    onClose();
  };

  const handleNever = async () => {
    await rateAppService.markNever();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRemindLater}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={32} color={Colors.gold} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* 5 Golden Stars Display */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name="star" size={24} color={Colors.gold} style={{ marginHorizontal: 2 }} />
            ))}
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRate} activeOpacity={0.85}>
            <Ionicons name="logo-google-playstore" size={18} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Rate on Google Play</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleRemindLater} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Remind Me Later</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={handleNever} activeOpacity={0.6}>
            <Text style={styles.dismissBtnText}>Don't ask again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.blue,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: Colors.grayLight,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  dismissBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  dismissBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
});
