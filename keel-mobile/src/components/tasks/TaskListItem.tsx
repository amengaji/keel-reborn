import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { TaskStatusChip, Status } from "./TaskStatusChip";

type Task = {
  id: number;
  code: string;
  title: string;
  status: Status;
};

const tasks: Task[] = [
  { id: 1, code: "D.1", title: "Identify bridge layout", status: "pending" },
  { id: 2, code: "D.2", title: "Explain radar components", status: "submitted" },
];


type Props = {
  code: string;
  title: string;
  status: Status;
  onPress: () => void;
};

export const TaskListItem: React.FC<Props> = ({
  code,
  title,
  status,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.row}>
      <View style={[styles.stripe, { backgroundColor: theme.colors.primary }]} />

      <View style={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          {code} — {title}
        </Text>

        <TaskStatusChip status={status} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 1,
  },
  stripe: {
    width: 6,
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  title: { fontWeight: "600", marginBottom: 4 },
});
