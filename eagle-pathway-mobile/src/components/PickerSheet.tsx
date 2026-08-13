import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from 'react-native';

export interface PickerOption {
  label: string;
  value: string;
  emoji?: string;   // for flags or icons
  icon?: string;    // alias for emoji
  subtitle?: string;
}

interface PickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (option: PickerOption) => void;
  options: PickerOption[];
  title: string;
  selected?: string;  // currently selected value for single-select
  searchable?: boolean;
  snapPoint?: string; // default '65%'
  isMultiSelect?: boolean;
  selectedValues?: string[]; // currently selected values for multi-select
  onMultiSelect?: (options: PickerOption[]) => void;
}

export default function PickerSheet({
  isOpen,
  onClose,
  onSelect,
  options,
  title,
  selected,
  searchable = true,
  snapPoint = '65%',
  isMultiSelect = false,
  selectedValues = [],
  onMultiSelect,
}: PickerSheetProps) {
  const [search, setSearch] = useState('');
  const [localMultiSelected, setLocalMultiSelected] = useState<string[]>(selectedValues);

  useEffect(() => {
    if (isMultiSelect) {
      setLocalMultiSelected(selectedValues);
    }
  }, [isOpen, selectedValues, isMultiSelect]);

  const filtered = useMemo(() =>
    search.trim() === ''
      ? options
      : options.filter(o =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase())
        ),
    [options, search]
  );

  const handleSingleSelect = (option: PickerOption) => {
    if (onSelect) onSelect(option);
    setSearch('');
    onClose();
  };

  const toggleMultiItem = (option: PickerOption) => {
    setLocalMultiSelected(prev => {
      const exists = prev.includes(option.value);
      return exists ? prev.filter(v => v !== option.value) : [...prev, option.value];
    });
  };

  const handleDoneMultiSelect = () => {
    if (onMultiSelect) {
      const selectedOpts = options.filter(o => localMultiSelected.includes(o.value));
      onMultiSelect(selectedOpts);
    }
    setSearch('');
    onClose();
  };

  if (!isOpen) return null;

  const sheetHeight: DimensionValue = (snapPoint as DimensionValue) || '70%';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheetContainer, { height: sheetHeight }]}>
          {/* Drag Handle Indicator */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={isMultiSelect ? handleDoneMultiSelect : onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Text style={isMultiSelect ? styles.doneText : styles.closeText}>
                {isMultiSelect ? 'Done ✓' : '✕'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          {searchable && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>
          )}

          {/* Options list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = isMultiSelect
                ? localMultiSelected.includes(item.value)
                : item.value === selected;

              return (
                <Pressable
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => (isMultiSelect ? toggleMultiItem(item) : handleSingleSelect(item))}
                >
                  <View style={styles.optionLeft}>
                    {(item.emoji || item.icon) ? (
                      <Text style={styles.emoji}>{item.emoji || item.icon}</Text>
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No results for "{search}"</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    backgroundColor: '#e5e7eb',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: '#6b7280', fontWeight: '600' },
  doneText: { fontSize: 15, color: '#1e3a8a', fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  listContent: {
    paddingBottom: 30,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f9fafb',
  },
  optionSelected: { backgroundColor: '#eff6ff' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  emoji: { fontSize: 22 },
  optionLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  optionLabelSelected: { color: '#1e3a8a', fontWeight: '700' },
  optionSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  checkmark: { fontSize: 16, color: '#1e3a8a', fontWeight: '700' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 14 },
});
