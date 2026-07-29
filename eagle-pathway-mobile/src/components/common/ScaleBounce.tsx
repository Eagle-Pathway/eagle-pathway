import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, ViewStyle, StyleProp, AccessibilityProps } from 'react-native';

interface ScaleBounceProps extends AccessibilityProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  disabled?: boolean;
}

export const ScaleBounce: React.FC<ScaleBounceProps> = ({
  children,
  onPress,
  style,
  activeScale = 0.96,
  disabled,
  ...accessibilityProps
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      tension: 150,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 6,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={accessibilityProps.accessible !== false}
      {...accessibilityProps}
    >
      <Animated.View style={[{ transform: [{ scale }] } as any, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
