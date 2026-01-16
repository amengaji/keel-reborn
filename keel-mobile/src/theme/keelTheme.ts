// src/theme/keelTheme.ts
import {
  MD3LightTheme as PaperLightTheme,
  MD3DarkTheme as PaperDarkTheme,
  MD3Theme,
} from "react-native-paper";

const primary = "#3194A0";
const primaryDark = "#1E6F7E";
const primaryLight = "#42A7B4";

const backgroundLight = "#F5F8FA";
const surfaceLight = "#FFFFFF";

const backgroundDark = "#0F1B1D";
const surfaceDark = "#1A282A";

export const keelLightTheme: MD3Theme = {
  ...PaperLightTheme,
  colors: {
    ...PaperLightTheme.colors,
    primary,
    primaryContainer: "#D7EFF2",
    onPrimary: "#FFFFFF",

    secondary: "#4C6273",
    secondaryContainer: "#E4EBEF",

    background: backgroundLight,
    surface: surfaceLight,

    surfaceVariant: "#E5EDF2",
    outline: "#D0D7DD",

    error: "#EF4444",
    onError: "#FFFFFF",

    onBackground: "#111827",
    onSurface: "#111827",
    onSurfaceVariant: "#6B7280",

    // Extra accents
    tertiary: primaryLight,
    onTertiary: "#FFFFFF",
  },
};

export const keelDarkTheme: MD3Theme = {
  ...PaperDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    primary,
    primaryContainer: primaryDark,
    onPrimary: "#FFFFFF",

    secondary: "#9FB4C4",
    secondaryContainer: "#24323A",

    background: backgroundDark,
    surface: surfaceDark,

    surfaceVariant: "#243338",
    outline: "#3A4A4F",

    error: "#F97373",
    onError: "#000000",

    onBackground: "#F0F7F8",
    onSurface: "#F0F7F8",
    onSurfaceVariant: "#C3D1D6",

    tertiary: primaryLight,
    onTertiary: "#000000",
  },
};
