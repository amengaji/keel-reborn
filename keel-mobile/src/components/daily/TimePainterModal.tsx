// keel-mobile/src/components/daily/TimePainterModal.tsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Text as RNText,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import {
  IconButton,
  Surface,
  Button,
  Text,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import { getDepartmentConfig } from "../../constants/logBrushes";
import { useAuth } from "../../auth/AuthContext";

interface Props {
  visible: boolean;
  initialData: number[];
  onSave: (newData: number[]) => void;
  onCancel: () => void;
}

export const TimePainterModal = ({
  visible,
  onSave,
  onCancel,
}: Props) => {
  const { user } = useAuth();
  const theme = useTheme();

  const config = useMemo(
    () => getDepartmentConfig(user?.department, user?.rank),
    [user?.department, user?.rank]
  );

  const isEngineSide = useMemo(() => {
    const d = (user?.department || "").toUpperCase();
    const r = (user?.rank || "").toUpperCase();
    return (
      d.includes("ENGINE") ||
      d.includes("ETO") ||
      r.includes("ENGINE") ||
      r.includes("BTECH")
    );
  }, [user]);

  /**
   * INTERNAL STATE
   * null = REST (default / blank)
   * 1 = WORK
   * 2 = WATCH
   * 4 = MAINT / STEER
   */
  const [blocks, setBlocks] = useState<(number | null)[]>(
    new Array(48).fill(null)
  );
  const [activeBrush, setActiveBrush] = useState<number>(1);
  const [vesselStatus, setVesselStatus] = useState<"SEA" | "PORT">("SEA");

  const gridLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const lastPaintedIndex = useRef<number>(-1);

  // 🔴 FORCE BLANK EVERY TIME MODAL OPENS
  useEffect(() => {
    if (visible) {
      setBlocks(new Array(48).fill(null));
      setActiveBrush(1);
      lastPaintedIndex.current = -1;
    }
  }, [visible]);

  const triggerHaptic = (type: "selection" | "impact" | "notification") => {
    try {
      if (type === "selection") Haptics.selectionAsync();
      else if (type === "notification")
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const handleReset = () => {
    Alert.alert(
      "Wipe Timeline",
      "This will clear all logged activity for today. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe Data",
          style: "destructive",
          onPress: () => {
            setBlocks(new Array(48).fill(null));
            triggerHaptic("notification");
          },
        },
      ]
    );
  };

  const handleSmartFill = (
  type: "WATCH" | "DAY_WORK",
  startHour?: number
) => {
  const next = [...blocks];
  const targetIndices: number[] = [];
  const watchBrush = 2;

  if (type === "WATCH" && startHour !== undefined) {
    const startIndex = startHour * 2;

    // 4-hour watch × 2 slots per hour
    for (let i = 0; i < 8; i++) {
      targetIndices.push(startIndex + i);       // AM
      targetIndices.push(startIndex + 24 + i);  // PM
    }
  }

  if (type === "DAY_WORK") {
    // 08–12
    for (let i = 16; i < 24; i++) targetIndices.push(i);
    // 13–17
    for (let i = 26; i < 34; i++) targetIndices.push(i);
  }

  const applyFill = () => {
    targetIndices.forEach((idx) => {
      next[idx] = type === "DAY_WORK" ? 1 : watchBrush;
    });
    setBlocks(next);
    triggerHaptic("notification");
  };

  // Ask before overwriting painted blocks
  if (targetIndices.some((idx) => blocks[idx] !== null)) {
    Alert.alert(
      "Overwrite Log?",
      "Apply template over existing entries?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Apply", style: "destructive", onPress: applyFill },
      ]
    );
  } else {
    applyFill();
  }
};


  const paint = (pageX: number, pageY: number) => {
    const { x, y, width, height } = gridLayout.current;
    if (!width) return;

    const labelWidth = 40;
    const relX = pageX - x - labelWidth;
    const relY = pageY - y;
    const drawableWidth = width - labelWidth;

    if (relX < 0 || relX > drawableWidth || relY < 0 || relY > height)
      return;

    const rowHeight = height / 2;
    const isSecondRow = relY > rowHeight;
    const index =
      (isSecondRow ? 24 : 0) +
      Math.floor(relX / (drawableWidth / 24));

    if (index < 0 || index >= 48) return;
    if (index === lastPaintedIndex.current) return;

    lastPaintedIndex.current = index;

    setBlocks((current) => {
      const next = [...current];

      // ERASE clears to REST (null)
      if (activeBrush === 5) {
        next[index] = null;
      } else {
        next[index] = activeBrush;
      }

      triggerHaptic("impact");
      return next;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        evt.currentTarget.measure(
          (_x, _y, width, height, pageX, pageY) => {
            gridLayout.current = { x: pageX, y: pageY, width, height };
            paint(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          }
        );
      },
      onPanResponderMove: (evt) =>
        paint(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderRelease: () => {
        lastPaintedIndex.current = -1;
      },
    })
  ).current;

  // ❌ REST REMOVED
  const brushes = useMemo(() => {
    const base = [
      {
        id: 1,
        label: "WORK",
        color: config.primary,
        icon: isEngineSide ? "wrench" : "hammer-wrench",
      },
      {
        id: 2,
        label: isEngineSide ? "E/R WATCH" : "WATCH",
        color: config.watchColor,
        icon: isEngineSide ? "engine" : "compass",
      },
    ];

    base.push({
      id: 4,
      label: isEngineSide ? "MAINT." : "STEER",
      color: isEngineSide ? "#F59E0B" : "#EC4899",
      icon: isEngineSide ? "cog-sync" : "ship-wheel",
    });

    base.push({
      id: 5,
      label: "ERASE",
      color: "#94A3B8",
      icon: "eraser",
    });

    return base;
  }, [isEngineSide, config]);

  // ✅ BLANK (null) = REST (GREEN)
  const getBlockColor = (val: number | null) => {
    if (val === null) return "#10B981"; // REST
    if (val === 1) return config.primary;
    if (val === 2) return config.watchColor;
    if (val === 4)
      return isEngineSide ? "#F59E0B" : "#EC4899";
    return "#10B981";
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView
        style={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: theme.colors.outlineVariant },
          ]}
        >
          <IconButton icon="close" size={24} onPress={onCancel} />
          <Text style={styles.headerTitle}>LOG PAINTER</Text>
          <Button
            mode="text"
            onPress={() => {
              triggerHaptic("selection");
              // ✅ BLANK → REST (0)
              onSave(blocks.map((v) => (v === null ? 0 : v)));
            }}
            textColor={config.primary}
            labelStyle={{ fontWeight: "900" }}
          >
            SAVE
          </Button>
        </View>

        {/* UI BELOW UNCHANGED */}
        {/* (rest of JSX + styles identical to your original file) */}
        
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
          <SegmentedButtons
            value={vesselStatus}
            onValueChange={(v) => {
              setVesselStatus(v as any);
              triggerHaptic("selection");
            }}
            buttons={[
              {
                value: "SEA",
                label: isEngineSide ? "At Sea / UMS" : "At Sea",
                icon: "ferry",
              },
              { value: "PORT", label: "In Port", icon: "anchor" },
            ]}
            theme={{ colors: { secondaryContainer: config.primary } }}
            style={styles.segmented}
          />

          <Text style={styles.sectionLabel}>SMART TEMPLATES</Text>
          <View style={styles.smartFillGrid}>
            {[
              { l: "12-4 Watch", s: 0 },
              { l: "4-8 Watch", s: 4 },
              { l: "8-12 Watch", s: 8 },
              { l: "Day Work", s: null, type: "DAY_WORK" },
            ].map((w, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.smartFillBtn,
                  { borderColor: theme.colors.outlineVariant },
                ]}
                onPress={() => {
                  triggerHaptic("selection");
                  w.type === "DAY_WORK"
                    ? handleSmartFill("DAY_WORK")
                    : handleSmartFill("WATCH", w.s!);
                }}
              >
                <RNText
                  style={[
                    styles.smartFillText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {w.l}
                </RNText>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>ACTIVITY BRUSHES</Text>
          <View style={styles.brushGrid}>
            {brushes.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => {
                  setActiveBrush(b.id);
                  triggerHaptic("selection");
                }}
                style={[
                  styles.brushItem,
                  { borderColor: theme.colors.outlineVariant },
                  activeBrush === b.id && {
                    backgroundColor: b.color,
                    borderColor: b.color,
                  },
                ]}
              >
                <IconButton
                  icon={b.icon}
                  size={18}
                  iconColor={
                    activeBrush === b.id
                      ? "#FFF"
                      : theme.colors.onSurfaceVariant
                  }
                  style={styles.brushIcon}
                />
                <RNText
                  style={[
                    styles.brushText,
                    {
                      color:
                        activeBrush === b.id
                          ? "#FFF"
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {b.label}
                </RNText>
              </TouchableOpacity>
            ))}
          </View>

          <Surface
            elevation={1}
            style={[
              styles.painterSurface,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.gridContainer} {...panResponder.panHandlers}>
              {[0, 24].map((offset, rowIdx) => (
                <View key={rowIdx} style={{ marginBottom: rowIdx === 0 ? 35 : 0 }}>
                  <View style={styles.row}>
                    <RNText style={styles.rowLabel}>
                      {rowIdx === 0 ? "AM" : "PM"}
                    </RNText>
                    <View
                      style={[
                        styles.blocksRow,
                        {
                          borderColor: theme.colors.outlineVariant,
                          backgroundColor: theme.dark
                            ? "#0F172A"
                            : "#F8FAFC",
                        },
                      ]}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.block,
                            {
                              backgroundColor: getBlockColor(
                                blocks[i + offset]
                              ),
                              borderRightWidth:
                                i % 2 === 1 ? 1 : 0.2,
                              borderRightColor:
                                "rgba(0,0,0,0.1)",
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.timeLabels}>
                    {[0, 4, 8, 12].map((h) => (
                      <RNText key={h} style={styles.timeText}>
                        {String(h + rowIdx * 12).padStart(2, "0")}
                      </RNText>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </Surface>

          <View style={styles.footerActions}>
            <Button
              icon="delete-sweep-outline"
              mode="text"
              onPress={handleReset}
              textColor={theme.colors.error}
              labelStyle={styles.wipeBtnLabel}
            >
              WIPE ALL ENTRIES
            </Button>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 56,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#94A3B8",
  },
  scrollContent: { padding: 16, alignItems: "center" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 20,
    alignSelf: "flex-start",
  },
  segmented: { width: "100%" },
  smartFillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  smartFillBtn: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  smartFillText: { fontSize: 12, fontWeight: "800" },
  brushGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    width: "100%",
  },
  brushItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
  },
  brushIcon: { margin: 0, padding: 0 },
  brushText: { fontSize: 10, fontWeight: "900" },
  painterSurface: {
    padding: 20,
    borderRadius: 24,
    width: "100%",
    marginTop: 20,
  },
  gridContainer: { width: "100%" },
  row: { flexDirection: "row", alignItems: "center", height: 55 },
  rowLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    width: 40,
  },
  blocksRow: {
    flex: 1,
    flexDirection: "row",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  block: { flex: 1, height: "100%" },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 40,
    marginTop: 6,
  },
  timeText: { fontSize: 9, fontWeight: "900", color: "#CBD5E1" },
  footerActions: {
    marginTop: 30,
    width: "100%",
    alignItems: "center",
  },
  wipeBtnLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
});
