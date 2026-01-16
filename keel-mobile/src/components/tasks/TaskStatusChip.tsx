import React from "react";
import { Chip, useTheme } from "react-native-paper";

export type Status = "pending" | "submitted" | "approved";

export const TaskStatusChip = ({ status }: { status: Status }) => {
  const theme = useTheme();

  const statusColors: Record<Status, string> = {
    pending: "#EF4444",      // red
    submitted: "#FACC15",    // yellow
    approved: "#22C55E",     // green
  };

  return (
    <Chip
      style={{
        height: 28,
        backgroundColor: statusColors[status],
      }}
      textStyle={{ color: "#fff", fontWeight: "600" }}
    >
      {status.toUpperCase()}
    </Chip>
  );
};
