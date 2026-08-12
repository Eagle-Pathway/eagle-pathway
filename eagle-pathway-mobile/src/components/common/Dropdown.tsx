import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';
import PickerField from '../PickerField';
import PickerSheet, { PickerOption } from '../PickerSheet';

export interface DropdownOption extends PickerOption {
  icon?: string; // alias for emoji
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
  snapPoint?: string;
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
  snapPoint,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = !isMultiSelect ? options.find(opt => opt.value === selectedValue) : null;
  const multiSelectedOptions = isMultiSelect ? options.filter(opt => selectedValues.includes(opt.value)) : [];

  const displayValue = isMultiSelect
    ? multiSelectedOptions.length === 0
      ? ''
      : multiSelectedOptions.length === 1
      ? multiSelectedOptions[0].label
      : `${multiSelectedOptions.length} Selected (${multiSelectedOptions.map(o => o.label).join(', ')})`
    : selectedOption
    ? selectedOption.label
    : '';

  const displayEmoji = isMultiSelect
    ? multiSelectedOptions.length === 1
      ? multiSelectedOptions[0].emoji || multiSelectedOptions[0].icon
      : undefined
    : selectedOption?.emoji || selectedOption?.icon;

  const computedSnapPoint = snapPoint || (options.length > 25 ? '75%' : '65%');

  return (
    <View style={[styles.container, style]}>
      <PickerField
        label={label || ''}
        value={displayValue}
        placeholder={placeholder}
        emoji={displayEmoji}
        onPress={() => setIsOpen(true)}
        error={!!error}
      />
      {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

      <PickerSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Option'}
        options={options}
        selected={selectedValue}
        onSelect={(opt) => {
          if (onValueChange) onValueChange(opt.value);
        }}
        isMultiSelect={isMultiSelect}
        selectedValues={selectedValues}
        onMultiSelect={(opts) => {
          if (onMultiValueChange) onMultiValueChange(opts.map(o => o.value));
        }}
        searchable={searchable}
        snapPoint={computedSnapPoint}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.xs,
    color: Colors.red,
    marginTop: -10,
    marginBottom: 8,
  },
});
