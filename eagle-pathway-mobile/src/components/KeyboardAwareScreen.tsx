import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  extraScrollHeight?: number;
}

export function KeyboardAwareScreen({
  children,
  style,
  contentContainerStyle,
  extraScrollHeight = 80,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        { paddingBottom: insets.bottom + 20 },
        contentContainerStyle,
      ]}
      enableOnAndroid={true}
      extraScrollHeight={extraScrollHeight}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
