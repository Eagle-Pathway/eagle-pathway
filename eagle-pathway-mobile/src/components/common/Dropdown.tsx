import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  FlatList, TextInput, SafeAreaView, ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: string;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  isMultiSelect?: boolean;
  selectedValues?: string[];
  onMultiValueChange?: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  style?: ViewStyle;
  error?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onValueChange,
  isMultiSelect = false,
  selectedValues = [],
  onMultiValueChange,
  placeholder = 'Select...',
  searchable = false,
  style,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const selectedOption = !isMultiSelect ? options.find(opt => opt.value === selectedValue) : null;
  const multiSelectedOptions = isMultiSelect ? options.filter(opt => selectedValues.includes(opt.value)) : [];

  const triggerLabel = isMultiSelect
    ? multiSelectedOptions.length === 0
      ? placeholder
      : multiSelectedOptions.length === 1
      ? `${multiSelectedOptions[0].icon ? multiSelectedOptions[0].icon + ' ' : ''}${multiSelectedOptions[0].label}`
      : `${multiSelectedOptions.length} Selected (${multiSelectedOptions.map(o => o.label).join(', ')})`
    : selectedOption
    ? `${selectedOption.icon ? selectedOption.icon + ' ' : ''}${selectedOption.label}`
    : placeholder;

  const toggleMultiSelect = (val: string) => {
    if (!onMultiValueChange) return;
    if (selectedValues.includes(val)) {
      onMultiValueChange(selectedValues.filter(v => v !== val));
    } else {
      onMultiValueChange([...selectedValues, val]);
    }
  };

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchText.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.trigger,
          error ? styles.triggerError : null
        ]}
        onPress={() => {
          setSearchText('');
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            ((!isMultiSelect && !selectedOption) || (isMultiSelect && multiSelectedOptions.length === 0)) && { color: Colors.textSecondary }
          ]}
          numberOfLines={1}
        >
          {triggerLabel}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>⚠️ {error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>{isMultiSelect ? '✓ Done' : '✕ Close'}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
            <View style={{ width: 60 }} />
          </View>

          {searchable && (
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor={Colors.textSecondary}
                clearButtonMode="while-editing"
              />
            </View>
          )}

          <FlatList
            data={filteredOptions}
            keyExtractor={item => item.value}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isSelected = isMultiSelect
                ? selectedValues.includes(item.value)
                : item.value === selectedValue;

              return (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemActive
                  ]}
                  onPress={() => {
                    if (isMultiSelect) {
                      toggleMultiSelect(item.value);
                    } else {
                      if (onValueChange) onValueChange(item.value);
                      setModalVisible(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextActive
                  ]}>
                    {item.icon ? `${item.icon}  ` : ''}{item.label}
                  </Text>
                  {isSelected && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  triggerError: {
    borderColor: Colors.red,
    borderWidth: 1.5,
  },
  triggerText: {
    fontSize: Typography.base,
    color: Colors.text,
  },
  arrow: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: Typography.xs,
    color: Colors.red,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  closeBtn: {
    paddingVertical: 6,
  },
  closeBtnText: {
    fontSize: Typography.base,
    color: Colors.blue,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchBar: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 40,
    fontSize: Typography.base,
    color: Colors.text,
  },
  list: {
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  optionItemActive: {
    backgroundColor: Colors.blueLight,
  },
  optionText: {
    fontSize: Typography.base,
    color: Colors.text,
  },
  optionTextActive: {
    color: Colors.blue,
    fontWeight: 'bold',
  },
  checkIcon: {
    fontSize: 16,
    color: Colors.blue,
    fontWeight: 'bold',
  },
});
