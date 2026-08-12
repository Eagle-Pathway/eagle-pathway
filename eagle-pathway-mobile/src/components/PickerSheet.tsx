import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

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
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [search, setSearch] = useState('');
  const [localMultiSelected, setLocalMultiSelected] = useState<string[]>(selectedValues);
  const snapPoints = useMemo(() => [snapPoint], [snapPoint]);

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

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            onPress={isMultiSelect ? handleDoneMultiSelect : onClose}
            style={styles.closeBtn}
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
                  <View>
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
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { backgroundColor: '#e5e7eb', width: 40 },
  container: { flex: 1, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 16, color: '#6b7280' },
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
