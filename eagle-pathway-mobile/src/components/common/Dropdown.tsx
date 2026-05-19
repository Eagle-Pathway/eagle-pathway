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
  selectedValue: string;
  onValueChange: (value: string) => void;
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
  placeholder = 'Select...',
  searchable = false,
  style,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const selectedOption = options.find(opt => opt.value === selectedValue);

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
        <Text style={[styles.triggerText, !selectedOption && { color: Colors.textSecondary }]}>
          {selectedOption ? `${selectedOption.icon ? selectedOption.icon + ' ' : ''}${selectedOption.label}` : placeholder}
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
              <Text style={styles.closeBtnText}>✕ Close</Text>
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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  item.value === selectedValue && styles.optionItemActive
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  setModalVisible(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  item.value === selectedValue && styles.optionTextActive
                ]}>
                  {item.icon ? `${item.icon}  ` : ''}{item.label}
                </Text>
                {item.value === selectedValue && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            )}
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
