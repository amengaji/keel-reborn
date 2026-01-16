//keel-mobile/src/components/inputs/TimeInputField.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { TextInput, Button, useTheme } from "react-native-paper";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

type TimeInputFieldProps = {
  label: string;
  value: Date | null;
  onChange: (next: Date | null) => void;

  disabled?: boolean;
  required?: boolean;
};

function is24HourSystem(): boolean {
  // If formatting 13:00 produces "13", system is 24h
  const test = new Date(2020, 1, 1, 13, 0);
  const formatted = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
  }).format(test);

  return formatted.includes("13");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTime(date: Date, is24h: boolean): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (is24h) {
    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad2(h12)}:${pad2(minutes)} ${period}`;
}

function extractTimeDigits(text: string): string {
  return (text.match(/\d/g) ?? []).join("").slice(0, 4);
}

function buildTimeText(digits: string): string {
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function parseDigitsToTime(digits: string, is24h: boolean): Date | null {
  if (digits.length !== 4) return null;

  const h = Number(digits.slice(0, 2));
  const m = Number(digits.slice(2, 4));

  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (m < 0 || m > 59) return null;

  if (is24h) {
    if (h < 0 || h > 23) return null;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  // For 12h typing, assume user enters 24h-style digits
  if (h < 1 || h > 12) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export default function TimeInputField({
  label,
  value,
  onChange,
  disabled,
  required,
}: TimeInputFieldProps) {
  const theme = useTheme();
  const is24h = true;

  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setText(formatTime(value, is24h));
    } else {
      setText("");
    }
  }, [value, is24h]);

  const handleTextChange = (next: string) => {
    const digits = extractTimeDigits(next);
    const display = buildTimeText(digits);
    setText(display);

    if (digits.length < 4) {
      onChange(null);
      return;
    }

    const parsed = parseDigitsToTime(digits, is24h);
    if (!parsed) return;

    onChange(parsed);
  };

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS === "android") setPickerOpen(false);
    if (event.type === "dismissed") return;

    const next = selected ?? value ?? new Date();
    onChange(next);
    setText(formatTime(next, is24h));
  };

  /**
 * Explicitly close the iOS time picker.
 * Required because spinner pickers never auto-dismiss on iOS.
 */
const closeTimePicker = () => {
  setPickerOpen(false);
};

  return (
    <View>
      <TextInput
        mode="outlined"
        label={required ? `${label} *` : label}
        value={text}
        onChangeText={handleTextChange}
        keyboardType="number-pad"
        disabled={disabled}
        placeholder={is24h ? "HH:MM" : "HH:MM"}
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        right={
          <TextInput.Icon
            icon="clock-outline"
            onPress={() => setPickerOpen(true)}
            disabled={disabled}
          />
        }
      />

{/* iOS TIME PICKER — requires explicit DONE button */}
{pickerOpen && Platform.OS === "ios" && (
  <View
    style={{
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginTop: 8,
      paddingBottom: 8,
    }}
  >
    <DateTimePicker
      value={value ?? new Date()}
      mode="time"
      display="spinner"
      onChange={handlePickerChange}
      locale="en-GB"
      is24Hour={is24h}
      themeVariant={theme.dark ? "dark" : "light"}
    />

    <Button
      mode="contained"
      onPress={closeTimePicker}
      style={{ marginHorizontal: 16, marginTop: 8 }}
    >
      Done
    </Button>
  </View>
)}

{/* Android TIME PICKER — auto-dismiss */}
{pickerOpen && Platform.OS === "android" && (
  <DateTimePicker
    value={value ?? new Date()}
    mode="time"
    display="clock"
    onChange={handlePickerChange}
    is24Hour={is24h}
  />
)}


    </View>
  );
}
