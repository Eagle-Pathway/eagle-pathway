import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

interface PickerFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  emoji?: string;
  onPress: () => void;
  error?: boolean;
}

export default function PickerField({
  label,
  value,
  placeholder = 'Select...',
  emoji,
  onPress,
  error,
}: PickerFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.field, error && styles.fieldError]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.left}>
          {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
          <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
            {value || placeholder}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldError: { borderColor: '#dc2626' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  emoji: { fontSize: 20 },
  value: { fontSize: 14, color: '#111827', fontWeight: '500', flex: 1 },
  placeholder: { color: '#9ca3af', fontWeight: '400' },
  chevron: { fontSize: 22, color: '#9ca3af', marginTop: -2, marginLeft: 8 },
});
