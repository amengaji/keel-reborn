//keel-mobile/src/screens/tasks/TasksHomeScreen.tsx

/**
 * ============================================================
 * TasksHomeScreen — SECTION OVERVIEW (REFINED UI)
 * ============================================================
 *
 * DESIGN GOALS:
 * - Maritime logbook density
 * - Clear visual hierarchy
 * - Action is subtle, not dominant
 * - Inspector-safe, cadet-friendly
 *
 * NOTE:
 * - No logic changes
 * - Progress still mocked
 * - DB wiring will come later
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, useTheme, ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import { KeelScreen } from "../../components/ui/KeelScreen";
import { KeelCard } from "../../components/ui/KeelCard";
import { KeelButton } from "../../components/ui/KeelButton";
import { useToast } from "../../components/toast/useToast";

/**
 * ============================================================
 * SECTION MASTER MAP (SAFE PLACEHOLDER)
 * ============================================================
 */
type TaskSection = {
  key: string;
  title: string;
};

const DECK_CADET_SECTIONS: TaskSection[] = [
  { key: "NAV", title: "Navigation & Passage Planning" },
  { key: "WATCH", title: "Bridge Watchkeeping" },
  { key: "COLREG", title: "COLREGs & Collision Avoidance" },
  { key: "RADAR", title: "Radar / ARPA / ECDIS" },
  { key: "MET", title: "Meteorology & Weather Routing" },
  { key: "SAFETY", title: "Safety & Emergency Procedures" },
  { key: "MANEUVER", title: "Ship Handling & Manoeuvring" },
  { key: "BRM", title: "Bridge Resource Management" },
  { key: "DOCS", title: "Ship Documentation & Logs" },
];

export default function TasksHomeScreen() {
  const theme = useTheme();
  const toast = useToast();
  const navigation = useNavigation<any>();

  const [sections, setSections] = useState(DECK_CADET_SECTIONS);

  useEffect(() => {
    try {
      setSections(DECK_CADET_SECTIONS);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task sections");
    }
  }, [toast]);

  /**
   * ------------------------------------------------------------
   * MOCKED PROGRESS (EXPLICIT TYPES TO AVOID TS WARNINGS)
   * ------------------------------------------------------------
   */
  const completed: number = 0;
  const total: number = 10;
  const progress = total === 0 ? 0 : completed / total;

  return (
    <KeelScreen>
      {/* ======================================================== */}
      <Text variant="titleLarge" style={styles.title}>
        Tasks
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        Training Record Book
      </Text>

      {/* ======================================================== */}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <KeelCard>
            <View style={styles.cardRow}>
              {/* ------------------------------------------------
                  Left status strip (visual state indicator)
                 ------------------------------------------------ */}
              <View style={styles.statusStripWrap}>
                <View
                  style={[
                    styles.statusStrip,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              </View>


              {/* ------------------------------------------------
                  Main content area
                 ------------------------------------------------ */}
              <View style={styles.cardContent}>
                {/* Title + Action Row */}
                <View style={styles.titleRow}>
                  <Text
                    variant="titleMedium"
                    style={styles.sectionTitle}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {/* Compact action chip (NOT dominant) */}
                  <KeelButton
                    mode="secondary"
                    onPress={() =>
                      navigation.navigate("TaskSection", {
                        sectionKey: item.key,
                        sectionTitle: item.title,
                      })
                    }
                  >
                    Open
                  </KeelButton>
                </View>

                {/* Meta text */}
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Mandatory: {completed} / {total} completed
                </Text>

                {/* Progress bar (thin, informational) */}
                <ProgressBar
                  progress={progress}
                  color={theme.colors.primary}
                  style={styles.progress}
                />
              </View>
            </View>
          </KeelCard>
        )}
      />
    </KeelScreen>
  );
}

/**
 * ============================================================
 * Styles — Tight, Logbook-Grade
 * ============================================================
 */
const styles = StyleSheet.create({
  title: {
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
statusStripWrap: {
  paddingVertical: 10, // equal top & bottom gap
},

statusStrip: {
  width: 4,
  flex: 1,
  borderRadius: 2,
},
openButtonWrap: {
  marginLeft: 8,
},

  cardContent: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 10, // reduced vertical padding (denser)
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: "700",
    flex: 1,
    paddingRight: 8,
  },
  progress: {
    height: 4, // thinner = informational
    borderRadius: 2,
    marginTop: 6,
  },
});
