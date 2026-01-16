import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Icon, useTheme } from "react-native-paper";

type ActionItem = {
  icon: string;
  label: string;
  onPress: () => void;
};

export const QuickActionsRow: React.FC<{ actions: ActionItem[] }> = ({
  actions,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {actions.map((a, i) => (
        <TouchableOpacity key={i} onPress={a.onPress} style={styles.item}>
          <Icon source={a.icon} size={28} color={theme.colors.primary} />
          <Text variant="bodySmall" style={styles.label}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  item: {
    alignItems: "center",
  },
  label: {
    marginTop: 6,
    color: "#6B7280",
  },
});
