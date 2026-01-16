//keel-mobile/src/components/inputs/LatLongInput.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Text, Chip } from "react-native-paper";

type Direction = "N" | "S" | "E" | "W";

type Props = {
  label: string;
  type: "LAT" | "LON";
  degrees: number | null;
  minutes: number | null;
  direction: Direction;
  onChange: (data: {
    degrees: number | null;
    minutes: number | null;
    direction: Direction;
    isValid: boolean;
  }) => void;
};

const OCEAN_GREEN = "#3194A0";

export default function LatLongInput({
  label,
  type,
  degrees,
  minutes,
  direction,
  onChange,
}: Props) {
  const maxDegrees = type === "LAT" ? 90 : 180;
  const degreeDigits = type === "LAT" ? 2 : 3;
  const hemispheres =
    type === "LAT"
      ? (["N", "S"] as const)
      : (["E", "W"] as const);

  const [text, setText] = useState("");
  const [isValid, setIsValid] = useState(false);

  // Sync when editing
  useEffect(() => {
    if (degrees != null && minutes != null) {
      const d = String(degrees).padStart(degreeDigits, "0");
      const m = minutes.toFixed(2).padStart(5, "0");
      setText(`${d}°${m}`);
    }
  }, [degrees, minutes, degreeDigits]);

  const parseAndValidate = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");

    if (digits.length < degreeDigits + 2) {
      return { deg: null, min: null, valid: false };
    }

    const deg = Number(digits.slice(0, degreeDigits));
    const minDigits = digits.slice(degreeDigits);
    const min =
      minDigits.length >= 4
        ? Number(minDigits.slice(0, 2) + "." + minDigits.slice(2, 4))
        : null;

    if (isNaN(deg) || isNaN(min!)) {
      return { deg: null, min: null, valid: false };
    }

    if (deg < 0 || deg > maxDegrees) {
      return { deg, min, valid: false };
    }

    if (min! < 0 || min! >= 60) {
      return { deg, min, valid: false };
    }

    return { deg, min, valid: true };
  };

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");

    let formatted = digits;
    if (digits.length > degreeDigits) {
      formatted =
        digits.slice(0, degreeDigits) +
        "°" +
        digits.slice(degreeDigits);
    }

    setText(formatted);

    const parsed = parseAndValidate(formatted);
    setIsValid(parsed.valid);

    onChange({
      degrees: parsed.deg,
      minutes: parsed.min,
      direction,
      isValid: parsed.valid,
    });
  };

  const parsed = parseAndValidate(text);

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>

      <View style={styles.row}>
        {/* INPUT */}
        <TextInput
          mode="outlined"
          value={text}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder={type === "LAT" ? "DD°mm.mm" : "DDD°mm.mm"}
          error={text.length > 0 && !isValid}
          style={styles.input}
        />

        {/* HEMISPHERE */}
        <View style={styles.hemiRow}>
          {hemispheres.map((h) => (
            <Chip
              key={h}
              compact
              onPress={() =>
                onChange({
                  degrees: parsed.deg,
                  minutes: parsed.min,
                  direction: h,
                  isValid: parsed.valid,
                })
              }
              style={[
                styles.hemiChip,
                direction === h && styles.hemiSelected,
              ]}
              textStyle={
                direction === h
                  ? styles.hemiTextSelected
                  : styles.hemiText
              }
            >
              {h}
            </Chip>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
  },
  hemiRow: {
    flexDirection: "row",
    marginLeft: 8,
  },
  hemiChip: {
    marginLeft: 4,
  },
  hemiSelected: {
    backgroundColor: OCEAN_GREEN,
  },
  hemiText: {
    color: "#374151",
  },
  hemiTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
