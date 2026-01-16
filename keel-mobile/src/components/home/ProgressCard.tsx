import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme, ProgressBar } from "react-native-paper";
import { KeelCard } from "../ui/KeelCard";

type Props = {
  completed: number;
  total: number;
};

export const ProgressCard: React.FC<Props> = ({ completed, total }) => {
  const theme = useTheme();
  const progress = total > 0 ? completed / total : 0;

  return (
    <KeelCard title="Your Training Progress">
      <View style={styles.container}>
        <Text variant="bodyMedium" style={styles.text}>
          {completed} of {total} tasks completed
        </Text>

        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={styles.progress}
        />

        <Text variant="bodySmall" style={styles.percent}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </KeelCard>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  text: { marginBottom: 8 },
  progress: { height: 8, borderRadius: 4 },
  percent: { marginTop: 8, color: "#6B7280" },
});
