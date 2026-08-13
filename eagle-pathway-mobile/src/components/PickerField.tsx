import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

interface PickerFieldProps {
  label?: string;
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
    <View style={[styles.wrapper, !label && styles.wrapperNoLabel]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.field, error && styles.fieldError]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.left}>
          {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
          <Text
            style={[styles.value, !value && styles.placeholder]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            allowFontScaling={false}
          >
            {value || placeholder}
          </Text>
        </View>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  wrapperNoLabel: { marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 46,
  },
  fieldError: { borderColor: '#dc2626' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 4 },
  emoji: { fontSize: 18 },
  value: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1 },
  placeholder: { color: '#9ca3af', fontWeight: '400' },
  chevron: { fontSize: 10, color: '#6b7280', marginLeft: 2 },
});
