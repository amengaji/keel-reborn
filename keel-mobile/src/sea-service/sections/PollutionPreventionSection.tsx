//keel-mobile/src/sea-service/sections/PollutionPreventionSection.tsx

/**
 * ============================================================
 * Sea Service — Pollution Prevention / MARPOL (Annex I–VI)
 * ============================================================
 *
 * UI MODE: Annex-grouped (advanced)
 * - Collapsed by default (per user choice A)
 * - Draft-safe ALWAYS
 * - Wizard controls completion/status (NOT this file)
 * - Ship-type aware (tanker / chemical tanker conditional fields)
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  HelperText,
  List,
  Menu,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import YesNoCapsule from "../../components/common/YesNoCapsule";
import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

const SECTION_KEY = "POLLUTION_PREVENTION";

/* ============================================================
 * Helpers
 * ============================================================ */
const onlyNumber = (v: string) => v.replace(/[^\d]/g, "");
const hasText = (v: any) => typeof v === "string" && v.trim().length > 0;

function normalizeShipType(shipType?: string | null) {
  if (!shipType) return "";

  /**
   * ============================================================
   * NORMALIZE SHIP TYPE (FINAL, PSC-SAFE)
   * ============================================================
   *
   * Examples:
   * "Oil Tanker"        → "OIL_TANKER"
   * "Product tanker"   → "PRODUCT_TANKER"
   * "Chemical Tanker"  → "CHEMICAL_TANKER"
   * "Bulk Carrier"     → "BULK_CARRIER"
   */
  return shipType
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "_");
}


function isTankerType(shipType?: string | null) {
  const t = normalizeShipType(shipType);
  return (
    t === "TANKER" ||
    t === "OIL_TANKER" ||
    t === "PRODUCT_TANKER" ||
    t === "CHEMICAL_TANKER" ||
    t === "GAS_TANKER"
  );
}

function isChemicalTanker(shipType?: string | null) {
  const t = normalizeShipType(shipType);
  return t === "CHEMICAL_TANKER";
}

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={!!value} onValueChange={onChange} />
    </View>
  );
}

/** Dropdown button with Menu (Paper-friendly, low-friction) */
function Dropdown({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string;
  options: string[];
  onPick: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setOpen(true)}
          style={styles.menuButton}
        >
          {hasText(value) ? `${label}: ${value}` : `Select ${label}`}
        </Button>
      }
    >
      {options.map((opt) => (
        <Menu.Item
          key={opt}
          title={opt}
          onPress={() => {
            onPick(opt);
            setOpen(false);
          }}
        />
      ))}
    </Menu>
  );
}

export default function PollutionPreventionSection(props: { onSaved?: () => void }) {
  const { onSaved } = props;
  const theme = useTheme();
  const toast = useToast();
  const { payload, updateSection } = useSeaService();

  const shipType = payload?.shipType ?? null;
/**
 * ============================================================
 * SHIP TYPE — TANKER DETECTION (FIXED)
 * ============================================================
 *
 * IMPORTANT:
 * - payload.shipType is the SINGLE source of truth
 * - DO NOT use local or derived shipType variables here
 */
  const tanker = isTankerType(shipType);
  const chemical = isChemicalTanker(shipType);

  const existing =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  const [form, setForm] = useState<Record<string, any>>({});
  

  useEffect(() => {
    setForm({
      /* ---------------- Annex I — Oil (PSC GATED) ---------------- */
      /**
       * null  → not yet answered (BLOCK SAVE)
       * false → NOT APPLICABLE
       * true  → applicable (dependent fields enforced)
       */
      annex1_owsFitted:
        existing.annex1_owsFitted ?? null,
      annex1_ppm15AlarmFitted:
        existing.annex1_ppm15AlarmFitted ?? null,

      annex1_bilgeSludgeTanksPresent:
        existing.annex1_bilgeSludgeTanksPresent ?? null,
      annex1_bilgeSludgeNotes:
        existing.annex1_bilgeSludgeNotes ?? "",

      annex1_oilRecordBookPartI:
        existing.annex1_oilRecordBookPartI ?? null,

      /* Tanker add-ons */
      annex1_odmeFitted:
        existing.annex1_odmeFitted ?? null,
      annex1_slopTankArrangement:
        existing.annex1_slopTankArrangement ?? null,
      annex1_slopTankNotes:
        existing.annex1_slopTankNotes ?? "",
      annex1_cowCapable:
        existing.annex1_cowCapable ?? null,
      annex1_sopepSmpepOnboard:
        existing.annex1_sopepSmpepOnboard ?? null,


      /* ---------------- Annex II — Noxious Liquid Substances (PSC GATED) ---------------- */
      /**
       * Applies ONLY to Chemical Tankers
       *
       * null  → not yet answered (BLOCK SAVE)
       * false → NOT APPLICABLE
       * true  → applicable (dependent fields enforced)
       */
      annex2_paManualOnboard:
        existing.annex2_paManualOnboard ?? null,
      annex2_cargoRecordBookOnboard:
        existing.annex2_cargoRecordBookOnboard ?? null,
      annex2_prewashSupported:
        existing.annex2_prewashSupported ?? null,
      annex2_prewashNotes:
        existing.annex2_prewashNotes ?? "",
      annex2_nlsDischargeAwareness:
        existing.annex2_nlsDischargeAwareness ?? null,


      /* ---------------- Annex III — IMDG (PSC GATED) ---------------- */
      /**
       * null  → not yet answered (BLOCK SAVE)
       * false → NOT APPLICABLE
       * true  → applicable (dependent fields enforced)
       */
      annex3_imdgDocsOnboard:
        existing.annex3_imdgDocsOnboard ?? null,
      annex3_cargoSecuringPlanAvailable:
        existing.annex3_cargoSecuringPlanAvailable ?? null,
      annex3_dgManifestProcedureUsed:
        existing.annex3_dgManifestProcedureUsed ?? null,
      annex3_dgNotes:
        existing.annex3_dgNotes ?? "",


      /* ---------------- Annex IV — Sewage (PSC GATED) ---------------- */
      /**
       * null  → not yet answered (BLOCK SAVE)
       * false → NOT APPLICABLE
       * true  → applicable
       */
      annex4_stpFitted:
        existing.annex4_stpFitted ?? null,
      annex4_holdingTankAvailable:
        existing.annex4_holdingTankAvailable ?? null,
      annex4_dischargeProcedureKnown:
        existing.annex4_dischargeProcedureKnown ?? null,
      annex4_dischargeNotes:
        existing.annex4_dischargeNotes ?? "",


      /* ---------------- Annex V — Garbage (PSC GATED) ---------------- */
      /**
       * null  → not yet answered (BLOCK SAVE)
       * false → NOT APPLICABLE
       * true  → applicable
       */
      annex5_garbageManagementPlanOnboard:
        existing.annex5_garbageManagementPlanOnboard ?? null,
      annex5_garbageRecordBookOnboard:
        existing.annex5_garbageRecordBookOnboard ?? null,
      annex5_segregationProcedureFollowed:
        existing.annex5_segregationProcedureFollowed ?? null,
      annex5_garbageNotes:
        existing.annex5_garbageNotes ?? "",


      /* ---------------- Annex VI — Air / Emissions ---------------- */
      /* ---------------- Annex VI — Air Pollution (PSC GATED) ---------------- */
      /**
       * null  → not yet answered (BLOCK SAVE)
       * false → NOT APPLICABLE
       * true  → applicable
       */
      annex6_iappCertificateOnboard:
        existing.annex6_iappCertificateOnboard ?? null,
      annex6_fuelChangeoverProcedure:
        existing.annex6_fuelChangeoverProcedure ?? null,
      annex6_odsRecordMaintained:
        existing.annex6_odsRecordMaintained ?? null,
      annex6_airPollutionNotes:
        existing.annex6_airPollutionNotes ?? "",


      annex6_odsRecordBook: existing.annex6_odsRecordBook ?? false,
      annex6_incineratorFitted: existing.annex6_incineratorFitted ?? false,
      annex6_incineratorDetails: existing.annex6_incineratorDetails ?? "",
      annex6_seempOnboard: existing.annex6_seempOnboard ?? false,
      annex6_imoDcsInUse: existing.annex6_imoDcsInUse ?? false,
      annex6_ciiEexiTracking: existing.annex6_ciiEexiTracking ?? "Unknown",
    });
  }, []);

  const set = (k: string, v: any) =>
    setForm((p) => ({
      ...p,
      [k]: v,
    }));

  const hasAnyData = useMemo(() => {
    return Object.values(form).some((v) => {
      if (typeof v === "boolean") return v === true;
      return String(v ?? "").trim() !== "";
    });
  }, [form]);

const save = () => {
  /**
   * ============================================================
   * ANNEX I — MANDATORY GATE CHECK
   * ============================================================
   */
  if (
    form.annex1_owsFitted === null ||
    form.annex1_bilgeSludgeTanksPresent === null ||
    form.annex1_oilRecordBookPartI === null
  ) {
    toast.error(
      "Please answer all mandatory Yes/No questions in Annex I (Oil Pollution)."
    );
    return;
  }

  /**
   * ============================================================
   * ANNEX II — MANDATORY GATE CHECK (CHEMICAL TANKERS ONLY)
   * ============================================================
   */
  if (normalizeShipType(payload.shipType) === "CHEMICAL_TANKER") {
    if (
      form.annex2_paManualOnboard === null ||
      form.annex2_cargoRecordBookOnboard === null ||
      form.annex2_prewashSupported === null ||
      form.annex2_nlsDischargeAwareness === null
    ) {
      toast.error(
        "Please answer all mandatory Yes/No questions in Annex II (Chemical Tankers)."
      );
      return;
    }
  }

  /**
 * ============================================================
 * ANNEX III — MANDATORY GATE CHECK (IMDG)
 * ============================================================
 */
if (
  form.annex3_imdgDocsOnboard === null ||
  form.annex3_cargoSecuringPlanAvailable === null ||
  form.annex3_dgManifestProcedureUsed === null
) {
  toast.error(
    "Please answer all mandatory Yes/No questions in Annex III (IMDG / Dangerous Goods)."
  );
  return;
}

/**
 * ============================================================
 * ANNEX IV — MANDATORY GATE CHECK (SEWAGE)
 * ============================================================
 */
if (
  form.annex4_stpFitted === null ||
  form.annex4_holdingTankAvailable === null ||
  form.annex4_dischargeProcedureKnown === null
) {
  toast.error(
    "Please answer all mandatory Yes/No questions in Annex IV (Sewage)."
  );
  return;
}

/**
 * ============================================================
 * ANNEX V — MANDATORY GATE CHECK (GARBAGE)
 * ============================================================
 */
if (
  form.annex5_garbageManagementPlanOnboard === null ||
  form.annex5_garbageRecordBookOnboard === null ||
  form.annex5_segregationProcedureFollowed === null
) {
  toast.error(
    "Please answer all mandatory Yes/No questions in Annex V (Garbage)."
  );
  return;
}


/**
 * ============================================================
 * ANNEX VI — MANDATORY GATE CHECK (AIR POLLUTION)
 * ============================================================
 */
if (
  form.annex6_iappCertificateOnboard === null ||
  form.annex6_fuelChangeoverProcedure === null ||
  form.annex6_odsRecordMaintained === null
) {
  toast.error(
    "Please answer all mandatory Yes/No questions in Annex VI (Air Pollution)."
  );
  return;
}


  updateSection(SECTION_KEY as any, form);
  toast.info(
    hasAnyData
      ? "Pollution Prevention saved."
      : "Pollution Prevention saved (empty draft)."
  );
   
  /**
   * ============================================================
   * UX RULE (GLOBAL – ALREADY APPROVED):
   * After saving a section, ALWAYS return to Sections overview
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
          { backgroundColor: theme.colors.background, paddingBottom: 120 },
        ]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Pollution Prevention (MARPOL)
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Annex I–VI essentials for cadet record book + PSC sanity checks. Save
          anytime — partial data is acceptable.
        </Text>

        <Divider style={styles.divider} />

        {!hasText(shipType) ? (
          <HelperText type="info" visible>
            Ship type not selected yet. Tanker / chemical tanker annex fields
            will appear automatically once ship type is set.
          </HelperText>
        ) : (
          <HelperText type="info" visible>
            Ship type: <Text style={{ fontWeight: "700" }}>{String(shipType)}</Text>
            {tanker ? " (Tanker fields enabled)" : ""}
            {chemical ? " (Annex II enabled)" : ""}
          </HelperText>
        )}

        {/* ============================================================
            Annex I — Oil
           ============================================================ */}
          <List.Accordion title="Annex I — Oil (Machinery spaces + tankers)">
            {/* OWS */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Oily Water Separator (OWS) fitted
              </Text>
              <YesNoCapsule
                value={form.annex1_owsFitted === true}
                onChange={(v) => set("annex1_owsFitted", v)}
              />
            </View>

            {form.annex1_owsFitted === true && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  15 ppm bilge alarm fitted
                </Text>
                <YesNoCapsule
                  value={form.annex1_ppm15AlarmFitted === true}
                  onChange={(v) => set("annex1_ppm15AlarmFitted", v)}
                />
              </View>
            )}

            {/* Bilge / sludge tanks */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Oily bilge / sludge tanks present
              </Text>
              <YesNoCapsule
                value={form.annex1_bilgeSludgeTanksPresent === true}
                onChange={(v) => set("annex1_bilgeSludgeTanksPresent", v)}
              />
            </View>

            {form.annex1_bilgeSludgeTanksPresent === true && (
              <TextInput
                label="Bilge / sludge tank notes (optional)"
                value={form.annex1_bilgeSludgeNotes}
                onChangeText={(v) => set("annex1_bilgeSludgeNotes", v)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}

            {/* ORB Part I */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Oil Record Book Part I onboard
              </Text>
              <YesNoCapsule
                value={form.annex1_oilRecordBookPartI === true}
                onChange={(v) => set("annex1_oilRecordBookPartI", v)}
              />
            </View>

            {/* Tanker-only add-ons */}
            {!tanker && (
              <HelperText type="info" visible>
                Tanker-only items will appear when ship type is a tanker.
              </HelperText>
            )}

            {tanker && (
              <>
                <Divider style={styles.innerDivider} />
                <Text style={styles.subHeading}>Tanker add-ons</Text>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>ODME fitted</Text>
                  <YesNoCapsule
                    value={form.annex1_odmeFitted === true}
                    onChange={(v) => set("annex1_odmeFitted", v)}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    Slop tank arrangement
                  </Text>
                  <YesNoCapsule
                    value={form.annex1_slopTankArrangement === true}
                    onChange={(v) => set("annex1_slopTankArrangement", v)}
                  />
                </View>

                {form.annex1_slopTankArrangement === true && (
                  <TextInput
                    label="Slop tank notes (optional)"
                    value={form.annex1_slopTankNotes}
                    onChangeText={(v) => set("annex1_slopTankNotes", v)}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                  />
                )}

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    COW capability (crude)
                  </Text>
                  <YesNoCapsule
                    value={form.annex1_cowCapable === true}
                    onChange={(v) => set("annex1_cowCapable", v)}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    SOPEP / SMPEP onboard
                  </Text>
                  <YesNoCapsule
                    value={form.annex1_sopepSmpepOnboard === true}
                    onChange={(v) => set("annex1_sopepSmpepOnboard", v)}
                  />
                </View>
              </>
            )}
          </List.Accordion>


        {/* ============================================================
            Annex II — NLS (Chemical tankers)
           ============================================================ */}
          {normalizeShipType(payload.shipType) === "CHEMICAL_TANKER" && (
            <List.Accordion title="Annex II — Noxious Liquid Substances (Chemical Tankers)">
              {/* P&A Manual */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  P&amp;A Manual onboard
                </Text>
                <YesNoCapsule
                  value={form.annex2_paManualOnboard === true}
                  onChange={(v) => set("annex2_paManualOnboard", v)}
                />
              </View>

              {/* Cargo Record Book */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  Cargo Record Book onboard
                </Text>
                <YesNoCapsule
                  value={form.annex2_cargoRecordBookOnboard === true}
                  onChange={(v) => set("annex2_cargoRecordBookOnboard", v)}
                />
              </View>

              {/* Prewash */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  Prewash supported for applicable cargoes
                </Text>
                <YesNoCapsule
                  value={form.annex2_prewashSupported === true}
                  onChange={(v) => set("annex2_prewashSupported", v)}
                />
              </View>

              {form.annex2_prewashSupported === true && (
                <TextInput
                  label="Prewash notes (optional)"
                  value={form.annex2_prewashNotes}
                  onChangeText={(v) => set("annex2_prewashNotes", v)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              )}

              {/* Awareness */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  Aware of NLS discharge restrictions
                </Text>
                <YesNoCapsule
                  value={form.annex2_nlsDischargeAwareness === true}
                  onChange={(v) => set("annex2_nlsDischargeAwareness", v)}
                />
              </View>
            </List.Accordion>
          )}


        {/* ============================================================
            Annex III — IMDG (Packaged DG)
           ============================================================ */}
          <List.Accordion title="Annex III — IMDG (Dangerous Goods)">
            {/* IMDG documentation */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                IMDG Code &amp; dangerous goods documentation onboard
              </Text>
              <YesNoCapsule
                value={form.annex3_imdgDocsOnboard === true}
                onChange={(v) => set("annex3_imdgDocsOnboard", v)}
              />
            </View>

            {/* Cargo securing plan */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Cargo securing / stowage plan available
              </Text>
              <YesNoCapsule
                value={form.annex3_cargoSecuringPlanAvailable === true}
                onChange={(v) => set("annex3_cargoSecuringPlanAvailable", v)}
              />
            </View>

            {/* DG manifest / declaration */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                DG manifest / declaration procedure followed
              </Text>
              <YesNoCapsule
                value={form.annex3_dgManifestProcedureUsed === true}
                onChange={(v) => set("annex3_dgManifestProcedureUsed", v)}
              />
            </View>

            {form.annex3_dgManifestProcedureUsed === true && (
              <TextInput
                label="DG handling / manifest notes (optional)"
                value={form.annex3_dgNotes}
                onChangeText={(v) => set("annex3_dgNotes", v)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}
          </List.Accordion>


        {/* ============================================================
            Annex IV — Sewage
           ============================================================ */}
          <List.Accordion title="Annex IV — Sewage">
            {/* STP fitted */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Approved sewage treatment plant (STP) fitted
              </Text>
              <YesNoCapsule
                value={form.annex4_stpFitted === true}
                onChange={(v) => set("annex4_stpFitted", v)}
              />
            </View>

            {/* Holding tank */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Sewage holding tank / discharge arrangement available
              </Text>
              <YesNoCapsule
                value={form.annex4_holdingTankAvailable === true}
                onChange={(v) => set("annex4_holdingTankAvailable", v)}
              />
            </View>

            {/* Discharge procedure */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Sewage discharge procedure known &amp; followed
              </Text>
              <YesNoCapsule
                value={form.annex4_dischargeProcedureKnown === true}
                onChange={(v) => set("annex4_dischargeProcedureKnown", v)}
              />
            </View>

            {form.annex4_dischargeProcedureKnown === true && (
              <TextInput
                label="Sewage discharge notes (optional)"
                value={form.annex4_dischargeNotes}
                onChangeText={(v) => set("annex4_dischargeNotes", v)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}
          </List.Accordion>


        {/* ============================================================
            Annex V — Garbage
           ============================================================ */}
          <List.Accordion title="Annex V — Garbage">
            {/* Garbage Management Plan */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Garbage Management Plan onboard
              </Text>
              <YesNoCapsule
                value={form.annex5_garbageManagementPlanOnboard === true}
                onChange={(v) => set("annex5_garbageManagementPlanOnboard", v)}
              />
            </View>

            {/* Garbage Record Book */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Garbage Record Book onboard
              </Text>
              <YesNoCapsule
                value={form.annex5_garbageRecordBookOnboard === true}
                onChange={(v) => set("annex5_garbageRecordBookOnboard", v)}
              />
            </View>

            {/* Segregation procedure */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Garbage segregation &amp; disposal procedure followed
              </Text>
              <YesNoCapsule
                value={form.annex5_segregationProcedureFollowed === true}
                onChange={(v) => set("annex5_segregationProcedureFollowed", v)}
              />
            </View>

            {form.annex5_segregationProcedureFollowed === true && (
              <TextInput
                label="Garbage handling notes (optional)"
                value={form.annex5_garbageNotes}
                onChangeText={(v) => set("annex5_garbageNotes", v)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}
          </List.Accordion>


        {/* ============================================================
            Annex VI — Air / Emissions
           ============================================================ */}
          <List.Accordion title="Annex VI — Air Pollution">
            {/* IAPP Certificate */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                IAPP Certificate onboard / applicable
              </Text>
              <YesNoCapsule
                value={form.annex6_iappCertificateOnboard === true}
                onChange={(v) => set("annex6_iappCertificateOnboard", v)}
              />
            </View>

            {/* Fuel changeover */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Fuel oil changeover procedure (SECA / ECA)
              </Text>
              <YesNoCapsule
                value={form.annex6_fuelChangeoverProcedure === true}
                onChange={(v) => set("annex6_fuelChangeoverProcedure", v)}
              />
            </View>

            {/* ODS record */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Ozone depleting substances (ODS) record maintained
              </Text>
              <YesNoCapsule
                value={form.annex6_odsRecordMaintained === true}
                onChange={(v) => set("annex6_odsRecordMaintained", v)}
              />
            </View>

            {form.annex6_odsRecordMaintained === true && (
              <TextInput
                label="Air pollution / ODS notes (optional)"
                value={form.annex6_airPollutionNotes}
                onChangeText={(v) => set("annex6_airPollutionNotes", v)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}
          </List.Accordion>


        <Divider style={styles.divider} />
      </KeyboardAwareScrollView>

      {/* Sticky Save Bar */}
      <View
        style={[
          styles.bottomBar,
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

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontWeight: "700", marginBottom: 6 },
  subtitle: { opacity: 0.8, marginBottom: 10 },

  divider: { marginVertical: 12 },
  innerDivider: { marginVertical: 10 },

  input: { marginTop: 10, marginBottom: 6 },
  menuButton: { alignSelf: "flex-start", marginTop: 10 },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  switchLabel: { flex: 1, opacity: 0.95 },

  subHeading: { fontWeight: "700", marginBottom: 4, marginTop: 4 },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
