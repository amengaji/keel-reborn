import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { KeelCard } from "../ui/KeelCard";
import { KeelButton } from "../ui/KeelButton";

export const PendingTasksCard: React.FC<{ count: number; onPress: () => void }> = ({
  count,
  onPress,
}) => {
  return (
    <KeelCard title="Pending Tasks">
      <View style={styles.container}>
        <Text variant="bodyMedium" style={styles.text}>
          You have {count} tasks waiting for completion.
        </Text>

        <KeelButton mode="primary" onPress={onPress}>
          View Tasks
        </KeelButton>
      </View>
    </KeelCard>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  text: { marginBottom: 12 },
});
