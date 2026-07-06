import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native';

interface KeyboardAwareScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Reusable wrapper that keeps focused inputs above the keyboard. Wrap any screen
 * whose content has text inputs.
 *
 * Behaviour note: iOS uses `padding`. On Android we intentionally leave
 * KeyboardAvoidingView's behavior undefined and rely on
 * `android.softwareKeyboardLayoutMode: "resize"` (set in app.json) + the inner
 * ScrollView — using behavior="height" here would fight the window resize and
 * cause layout jank. `keyboardShouldPersistTaps="handled"` lets taps (e.g. the
 * password eye toggle, submit button) work on the first tap while the keyboard
 * is open.
 *
 * Do NOT use this for FlatList-based screens (e.g. the chat/assistant message
 * list) — those need an inverted list, not a ScrollView.
 */
export function KeyboardAwareScreen({
  children,
  contentContainerStyle,
  style,
  ...scrollProps
}: KeyboardAwareScreenProps) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.flex, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
