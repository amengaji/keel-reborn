//keel-mobile/src/screens/VesselParticularsScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import {
  Text,
  useTheme,
  Surface,
  SegmentedButtons,
  TouchableRipple,
  Button,
  TextInput,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import {
  Ship,
  Cog,
  Zap,
  Utensils,
  Anchor,
  ShieldAlert,
  ArrowRight,
  Lock,
  CheckCircle2,
  ClipboardList,
  Maximize,
  MapPin,
  Calendar,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateInputField from "../components/inputs/DateInputField";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export const VesselParticularsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const [workflowStep, setWorkflowStep] = useState(1);
  const [dept, setDept] = useState("deck");
  const [signOnDate, setSignOnDate] = useState<Date | null>(new Date());
  const [port, setPort] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const [genSpecs, setGenSpecs] = useState({
    vesselName: "",
    imo: "",
    callSign: "",
    flag: "",
    loa: "",
    breadth: "",
    summerDraft: "",
  });

  const updateSpec = (key: string, val: string) => {
    if (workflowStep > 1) return;
    setGenSpecs({ ...genSpecs, [key]: val });
  };

  const handleSignOn = () => {
    if (!port || !genSpecs.vesselName || !genSpecs.imo) {
      Toast.show({
        type: "error",
        text1: "Information Incomplete",
        text2: "Vessel Name, IMO, and Port are mandatory to Sign-On.",
      });
      return;
    }
    setWorkflowStep(2);
    Toast.show({
      type: "success",
      text1: "Sign-On Complete",
      text2: "Proceed to Safety Familiarization.",
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sectionWrapper}>
        <LinearGradient
          colors={
            workflowStep === 1
              ? [theme.colors.primary, "#1A2426"]
              : ["#2C3E50", "#1A1A1A"]
          }
          style={styles.heroGradient}
        >
          <View style={styles.headerTopRow}>
            <Text style={styles.stepTag}>STEP 01: GENERAL IDENTITY</Text>
            {workflowStep > 1 && <CheckCircle2 size={20} color="#4ADE80" />}
          </View>

          <Text style={styles.heroTitle}>
            {workflowStep === 1
              ? "Vessel Sign-On"
              : genSpecs.vesselName || "Vessel Signed-On"}
          </Text>

          <View style={styles.formInside}>
            {workflowStep === 1 ? (
              <>
                <View style={styles.inputRow}>
                  {/* 🔧 FIXED DATE INPUT (NO WHITE BACKGROUND) */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <DateInputField
                      label="Joining Date"
                      value={signOnDate}
                      onChange={setSignOnDate}
                      required
                      
                    />
                  </View>

                  <TextInput
                    mode="flat"
                    placeholder="Port of Joining"
                    value={port}
                    onChangeText={setPort}
                    textColor="#FFF"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={[styles.flatInput, { flex: 1 }]}
                  />
                </View>

                <TextInput
                  mode="flat"
                  placeholder="Full Vessel Name"
                  value={genSpecs.vesselName}
                  onChangeText={(v) => updateSpec("vesselName", v)}
                  textColor="#FFF"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.flatInput}
                />

                <View style={styles.inputRow}>
                  <TextInput
                    mode="flat"
                    placeholder="IMO Number"
                    value={genSpecs.imo}
                    onChangeText={(v) => updateSpec("imo", v)}
                    keyboardType="numeric"
                    textColor="#FFF"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={[styles.flatInput, { flex: 1, marginRight: 8 }]}
                  />
                  <TextInput
                    mode="flat"
                    placeholder="Call Sign"
                    value={genSpecs.callSign}
                    onChangeText={(v) => updateSpec("callSign", v)}
                    textColor="#FFF"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={[styles.flatInput, { flex: 1 }]}
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={handleSignOn}
                  style={styles.onboardBtn}
                  buttonColor="#FFF"
                  textColor={theme.colors.primary}
                >
                  Confirm Identity & Sign-On
                </Button>
              </>
            ) : (
              <View style={styles.confirmedBox}>
                <Text style={styles.confirmedText}>
                  IMO: {genSpecs.imo} | Call Sign: {genSpecs.callSign}
                </Text>
                <Text style={styles.confirmedText}>
                  Port: {port.toUpperCase()}
                </Text>
                <Text style={styles.confirmedText}>
                  Joined: {signOnDate?.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* EVERYTHING BELOW IS UNTOUCHED */}
      <View style={[styles.sectionWrapper, workflowStep < 2 && styles.lockedOpacity]}>
        <Surface style={styles.glassCard} elevation={workflowStep === 2 ? 4 : 0}>
          <TouchableRipple
            onPress={() => workflowStep === 2 && navigation.navigate("SafetyMap")}
            style={styles.ripple}
            disabled={workflowStep !== 2}
          >
            <View style={styles.safetyContent}>
              <View style={styles.iconCircle}>
                <ShieldAlert
                  color={
                    workflowStep === 2
                      ? theme.colors.error
                      : theme.colors.outline
                  }
                  size={24}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.stepTagAlt}>STEP 02</Text>
                <Text style={styles.cardMainLabel}>
                  Safety Familiarization
                </Text>
                <Text style={styles.subtext}>
                  Mandatory Physical Walkthrough
                </Text>
              </View>
              {workflowStep < 2 ? (
                <Lock size={20} color={theme.colors.outline} />
              ) : (
                <ArrowRight size={20} color={theme.colors.primary} />
              )}
            </View>
          </TouchableRipple>
        </Surface>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionWrapper: { paddingHorizontal: 16, marginTop: 16 },
  heroGradient: { borderRadius: 24, padding: 24, minHeight: 200 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between" },
  stepTag: {
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: "900",
  },
  heroTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },
  formInside: { marginTop: 15 },
  inputRow: { flexDirection: "row", marginBottom: 5 },
  flatInput: {
    backgroundColor: "transparent",
    height: 45,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  onboardBtn: { borderRadius: 12, marginTop: 15 },
  confirmedBox: { marginTop: 10 },
  confirmedText: {
    color: "#4ADE80",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 4,
  },
  lockedOpacity: { opacity: 0.5 },
  glassCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  ripple: { padding: 20 },
  safetyContent: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepTagAlt: {
    fontSize: 10,
    fontWeight: "900",
    opacity: 0.4,
    letterSpacing: 1,
  },
  cardMainLabel: { fontSize: 16, fontWeight: "800" },
  subtext: { fontSize: 12, opacity: 0.5 },
  bottomSpacer: { height: 100 },
});
