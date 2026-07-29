import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/utils/theme';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  /** Style applied to the outer bordered container (not the TextInput itself). */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * A password field with a show/hide eye toggle, styled to match the app's other
 * inputs (rounded, bordered, #fafafa fill). Drop-in replacement for a
 * `<TextInput secureTextEntry />` — forwards all standard TextInput props.
 */
export const PasswordInput = React.forwardRef<TextInput, PasswordInputProps>(
  ({ containerStyle, style, ...props }, ref) => {
    const [hidden, setHidden] = useState(true);

    return (
      <View style={[styles.container, containerStyle]}>
        <TextInput
          {...props}
          ref={ref}
          style={[styles.input, style]}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={props.placeholderTextColor ?? Colors.textSecondary}
        />
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setHidden((h) => !h)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
        >
          <Ionicons name={hidden ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    fontSize: Typography.lg,
    color: Colors.text,
  },
  toggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
});
