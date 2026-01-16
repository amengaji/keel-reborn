//keel-mobile/src/sea-service/sections/LifeSavingAppliancesSection.tsx

/**
 * ============================================================
 * Sea Service — Life Saving Appliances (SUPER UX)
 * ============================================================
 *
 * DESIGN GOALS:
 * - Modern, low-friction UX
 * - Marine-accurate & audit-grade
 * - Draft-safe ALWAYS
 * - Completion logic handled ONLY by SeaServiceWizard
 *
 * UX PATTERNS USED:
 * - Checkboxes → availability
 * - Radio groups → equipment type
 * - Dropdowns → standardised choices
 * - Conditional fields → avoid clutter
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  Checkbox,
  RadioButton,
  Menu,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

const SECTION_KEY = "LIFE_SAVING_APPLIANCES";

export default function LifeSavingAppliancesSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();
  const { payload, updateSection } = useSeaService();

  const existing =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  const [form, setForm] = useState<any>({});
  const [lifeboatMenuOpen, setLifeboatMenuOpen] = useState(false);
  const [liferaftMenuOpen, setLiferaftMenuOpen] = useState(false);

  useEffect(() => {
    setForm({
      lifeboatsAvailable: existing.lifeboatsAvailable ?? false,
      lifeboatType: existing.lifeboatType ?? "",
      lifeboatCount: existing.lifeboatCount ?? "",
      lifeboatCapacity: existing.lifeboatCapacity ?? "",
      lifeboatMake: existing.lifeboatMake ?? "",

      liferaftsAvailable: existing.liferaftsAvailable ?? false,
      liferaftType: existing.liferaftType ?? "",
      liferaftCount: existing.liferaftCount ?? "",
      liferaftCapacity: existing.liferaftCapacity ?? "",
      liferaftMake: existing.liferaftMake ?? "",

      rescueBoatAvailable: existing.rescueBoatAvailable ?? false,
      rescueBoatMake: existing.rescueBoatMake ?? "",

      lifejacketsCount: existing.lifejacketsCount ?? "",
      immersionSuitsCount: existing.immersionSuitsCount ?? "",

      epirbType: existing.epirbType ?? "",
      sartType: existing.sartType ?? "",
    });
  }, []);

  const set = (k: string, v: any) =>
    setForm((p: any) => ({ ...p, [k]: v }));

const save = () => {
  /**
   * ============================================================
   * Draft-safe save (partial allowed)
   * ============================================================
   *
   * - Never block save
   * - Status (NOT_STARTED / IN_PROGRESS / COMPLETE)
   *   handled centrally in SeaServiceContext
   */
  updateSection(SECTION_KEY, form);

  toast.info(
    "Saved as draft. Complete all applicable items to mark this section as Completed."
  );

  /**
   * ============================================================
   * UX RULE:
   * After saving, ALWAYS return to Sections overview
   * ============================================================
   */
  if (onSaved) {
    onSaved();
  }
};


  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      enableOnAndroid
    >
      <Text variant="headlineSmall" style={styles.title}>
        Life Saving Appliances
      </Text>

      {/* ================= LIFEB OATS ================= */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium">Lifeboats</Text>

      <Checkbox.Item
        label="Lifeboats fitted on vessel"
        status={form.lifeboatsAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("lifeboatsAvailable", !form.lifeboatsAvailable)
        }
      />

      {form.lifeboatsAvailable && (
        <>
          <Menu
            visible={lifeboatMenuOpen}
            onDismiss={() => setLifeboatMenuOpen(false)}
            anchor={
              <TextInput
                label="Lifeboat Type"
                value={form.lifeboatType}
                mode="outlined"
                onFocus={() => setLifeboatMenuOpen(true)}
                style={styles.input}
              />
            }
          >
            {["Open", "Enclosed", "Free-Fall"].map((t) => (
              <Menu.Item
                key={t}
                onPress={() => {
                  set("lifeboatType", t);
                  setLifeboatMenuOpen(false);
                }}
                title={t}
              />
            ))}
          </Menu>

          <TextInput
            label="Number of Lifeboats"
            keyboardType="numeric"
            value={form.lifeboatCount}
            onChangeText={(v) => set("lifeboatCount", v)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Capacity per Lifeboat (persons)"
            keyboardType="numeric"
            value={form.lifeboatCapacity}
            onChangeText={(v) => set("lifeboatCapacity", v)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Lifeboat Make & Model"
            value={form.lifeboatMake}
            onChangeText={(v) => set("lifeboatMake", v)}
            mode="outlined"
            style={styles.input}
          />
        </>
      )}

      {/* ================= LIFERAFTS ================= */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium">Liferafts</Text>

      <Checkbox.Item
        label="Liferafts fitted on vessel"
        status={form.liferaftsAvailable ? "checked" : "unchecked"}
        onPress={() =>
          set("liferaftsAvailable", !form.liferaftsAvailable)
        }
      />

      {form.liferaftsAvailable && (
        <>
          <Menu
            visible={liferaftMenuOpen}
            onDismiss={() => setLiferaftMenuOpen(false)}
            anchor={
              <TextInput
                label="Liferaft Type"
                value={form.liferaftType}
                mode="outlined"
                onFocus={() => setLiferaftMenuOpen(true)}
                style={styles.input}
              />
            }
          >
            {["Throw-Overboard", "Davit-Launched"].map((t) => (
              <Menu.Item
                key={t}
                onPress={() => {
                  set("liferaftType", t);
                  setLiferaftMenuOpen(false);
                }}
                title={t}
              />
            ))}
          </Menu>

          <TextInput
            label="Number of Liferafts"
            keyboardType="numeric"
            value={form.liferaftCount}
            onChangeText={(v) => set("liferaftCount", v)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Capacity per Liferaft (persons)"
            keyboardType="numeric"
            value={form.liferaftCapacity}
            onChangeText={(v) => set("liferaftCapacity", v)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Liferaft Make & Model"
            value={form.liferaftMake}
            onChangeText={(v) => set("liferaftMake", v)}
            mode="outlined"
            style={styles.input}
          />
        </>
      )}

      {/* ================= RESCUE BOAT ================= */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium">Rescue Boat</Text>

      <RadioButton.Group
        onValueChange={(v) =>
          set("rescueBoatAvailable", v === "yes")
        }
        value={form.rescueBoatAvailable ? "yes" : "no"}
      >
        <View style={styles.row}>
          <RadioButton value="yes" />
          <Text>Available</Text>
          <RadioButton value="no" />
          <Text>Not Available</Text>
        </View>
      </RadioButton.Group>

      {form.rescueBoatAvailable && (
        <TextInput
          label="Rescue Boat Make & Model"
          value={form.rescueBoatMake}
          onChangeText={(v) => set("rescueBoatMake", v)}
          mode="outlined"
          style={styles.input}
        />
      )}

      {/* ================= PERSONAL LSA ================= */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium">Personal LSA</Text>

      <TextInput
        label="Number of Lifejackets"
        keyboardType="numeric"
        value={form.lifejacketsCount}
        onChangeText={(v) => set("lifejacketsCount", v)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Number of Immersion Suits"
        keyboardType="numeric"
        value={form.immersionSuitsCount}
        onChangeText={(v) => set("immersionSuitsCount", v)}
        mode="outlined"
        style={styles.input}
      />

      {/* ================= DISTRESS SYSTEMS ================= */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium">Distress & Alerting Systems</Text>

      <TextInput
        label="EPIRB Type / Make"
        value={form.epirbType}
        onChangeText={(v) => set("epirbType", v)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="SART Type (Radar / AIS-SART)"
        value={form.sartType}
        onChangeText={(v) => set("sartType", v)}
        mode="outlined"
        style={styles.input}
      />

      {/* ================= DISTRESS SIGNALS (PYROTECHNICS) ================= */}
<Divider style={styles.divider} />
<Text variant="titleMedium">Distress Signals (SOLAS)</Text>

<Checkbox.Item
  label="Rocket Parachute Flares available"
  status={form.rocketFlaresAvailable ? "checked" : "unchecked"}
  onPress={() =>
    set(
      "rocketFlaresAvailable",
      !form.rocketFlaresAvailable
    )
  }
/>

{form.rocketFlaresAvailable && (
  <TextInput
    label="Rocket Parachute Flares – Quantity"
    keyboardType="numeric"
    value={form.rocketFlaresQty}
    onChangeText={(v) =>
      set("rocketFlaresQty", v)
    }
    mode="outlined"
    style={styles.input}
  />
)}

<Checkbox.Item
  label="Hand Flares available"
  status={form.handFlaresAvailable ? "checked" : "unchecked"}
  onPress={() =>
    set(
      "handFlaresAvailable",
      !form.handFlaresAvailable
    )
  }
/>

{form.handFlaresAvailable && (
  <TextInput
    label="Hand Flares – Quantity"
    keyboardType="numeric"
    value={form.handFlaresQty}
    onChangeText={(v) =>
      set("handFlaresQty", v)
    }
    mode="outlined"
    style={styles.input}
  />
)}

<Checkbox.Item
  label="Buoyant Smoke Signals available"
  status={
    form.smokeSignalsAvailable ? "checked" : "unchecked"
  }
  onPress={() =>
    set(
      "smokeSignalsAvailable",
      !form.smokeSignalsAvailable
    )
  }
/>

{form.smokeSignalsAvailable && (
  <TextInput
    label="Buoyant Smoke Signals – Quantity"
    keyboardType="numeric"
    value={form.smokeSignalsQty}
    onChangeText={(v) =>
      set("smokeSignalsQty", v)
    }
    mode="outlined"
    style={styles.input}
  />
)}

<Checkbox.Item
  label="Line Throwing Apparatus available"
  status={
    form.lineThrowingAvailable ? "checked" : "unchecked"
  }
  onPress={() =>
    set(
      "lineThrowingAvailable",
      !form.lineThrowingAvailable
    )
  }
/>

{form.lineThrowingAvailable && (
  <TextInput
    label="Line Throwing Apparatus – Sets"
    keyboardType="numeric"
    value={form.lineThrowingQty}
    onChangeText={(v) =>
      set("lineThrowingQty", v)
    }
    mode="outlined"
    style={styles.input}
  />
)}

    </KeyboardAwareScrollView>
    <View
  style={[
    styles.stickyBar,
    {
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.outlineVariant,
    },
  ]}
>
  <Button mode="contained" onPress={save}>
    Save Section
  </Button>
</View>
</View>
  );
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontWeight: "700", marginBottom: 8 },
  divider: { marginVertical: 16 },
  input: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  save: { marginTop: 24 },
  stickyBar: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: 12,
  borderTopWidth: 1,
},

});
