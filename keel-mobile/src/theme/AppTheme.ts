//keel-mobile/src/theme/AppTheme.ts

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * MARITIME THEME CONFIGURATION
 * Primary Color: #3194A0 (Ocean Green)
 * Dark Mode Background: Grey-Green/Blue (#1A2426)
 */

const PRIMARY_COLOR = '#3194A0';

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: PRIMARY_COLOR,
    secondary: '#2C3E50', // Deep Naval Blue
    error: '#B00020',
    background: '#F8FAFA', // Very light grey-green tint
    surface: '#FFFFFF',
    outline: '#79747E',
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: PRIMARY_COLOR,
    secondary: '#34495E',
    error: '#CF6679',
    background: '#1A2426', // Custom Grey-Green/Blue on the darker side
    surface: '#242F31', // Slightly lighter than background for cards
    outline: '#938F99',
    onPrimary: '#FFFFFF',
  },
};