import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ToastConfigParams } from 'react-native-toast-message';

const Colors = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  info: '#1e3a8a',
  successBg: '#f0fdf4',
  errorBg: '#fef2f2',
  warningBg: '#fffbeb',
  infoBg: '#eff6ff',
};

const ToastBase = ({
  text1,
  text2,
  borderColor,
  iconColor,
  icon,
  bg,
}: {
  text1?: string;
  text2?: string;
  borderColor: string;
  iconColor: string;
  icon: string;
  bg: string;
}) => (
  <View style={[styles.container, { backgroundColor: bg, borderLeftColor: borderColor }]}>
    <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
    <View style={styles.textContainer}>
      {text1 ? <Text style={[styles.title, { color: borderColor }]}>{text1}</Text> : null}
      {text2 ? <Text style={styles.message}>{text2}</Text> : null}
    </View>
  </View>
);

export const toastConfig = {
  success: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastBase text1={text1} text2={text2} borderColor={Colors.success}
      iconColor={Colors.success} icon="✓" bg={Colors.successBg} />
  ),
  error: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastBase text1={text1} text2={text2} borderColor={Colors.error}
      iconColor={Colors.error} icon="✕" bg={Colors.errorBg} />
  ),
  warning: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastBase text1={text1} text2={text2} borderColor={Colors.warning}
      iconColor={Colors.warning} icon="⚠" bg={Colors.warningBg} />
  ),
  info: ({ text1, text2 }: ToastConfigParams<any>) => (
    <ToastBase text1={text1} text2={text2} borderColor={Colors.info}
      iconColor={Colors.info} icon="ℹ" bg={Colors.infoBg} />
  ),
};

const styles = StyleSheet.create({
  container: {
    width: '92%',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: '4%',
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});
