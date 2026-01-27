//keel-mobile/src/components/ui/KeelProgressBar.tsx

/**
 * ============================================================
 * KeelProgressBar — Modern & Minimal
 * ============================================================
 * * A sleek, rounded progress bar with "Ocean Green" branding.
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

type Props = {
  progress: number; // 0.0 to 1.0
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
};

export const KeelProgressBar = ({ 
  progress, 
  height = 6, 
  color, 
  trackColor, 
  style 
}: Props) => {
  const theme = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Animate whenever progress changes
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.max(0, Math.min(1, progress)), // Clamp 0-1
      duration: 800, // Smooth transition
      useNativeDriver: false, // Width layout animation needs JS driver
    }).start();
  }, [progress]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor || theme.colors.surfaceVariant,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolation,
            backgroundColor: color || theme.colors.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});