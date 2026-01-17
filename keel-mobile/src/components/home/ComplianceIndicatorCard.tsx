// keel-mobile/src/components/home/ComplianceIndicatorCard.tsx

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, useTheme } from "react-native-paper";
import { AlertCircle, CheckCircle2, Info, ChevronRight } from "lucide-react-native";

export type ComplianceStatus = "ON_TRACK" | "ATTENTION" | "RISK" | "NOT_AVAILABLE";

interface Props {
  title: string;
  status: ComplianceStatus;
  summary: string;
  onPress?: () => void; // Added to resolve TS2322
}

export default function ComplianceIndicatorCard({ title, status, summary, onPress }: Props) {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case "ON_TRACK":
        return { color: "#4ADE80", icon: <CheckCircle2 size={18} color="#4ADE80" />, label: "ON TRACK" };
      case "RISK":
        return { color: "#F87171", icon: <AlertCircle size={18} color="#F87171" />, label: "RISK" };
      case "ATTENTION":
        return { color: "#FBBF24", icon: <AlertCircle size={18} color="#FBBF24" />, label: "ATTENTION" };
      default:
        return { color: "rgba(0,0,0,0.3)", icon: <Info size={18} color="rgba(0,0,0,0.3)" />, label: "PENDING" };
    }
  };

  const config = getStatusConfig();

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
      <Surface style={styles.card} elevation={0}>
        <View style={styles.content}>
          <View style={[styles.indicator, { backgroundColor: config.color }]} />
          <View style={styles.textGroup}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.badge}>
                {config.icon}
                <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>
            <Text style={styles.summary} numberOfLines={1}>{summary}</Text>
          </View>
          {onPress && <ChevronRight size={20} color="rgba(0,0,0,0.2)" />}
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(49, 148, 160, 0.15)",
    overflow: 'hidden'
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16
  },
  indicator: {
    width: 6,
    height: '100%',
    marginRight: 16
  },
  textGroup: {
    flex: 1,
    paddingVertical: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A2426"
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 6,
    letterSpacing: 0.5
  },
  summary: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    fontWeight: "600"
  }
});