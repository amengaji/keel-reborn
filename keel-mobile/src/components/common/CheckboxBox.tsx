//keel-mobile/src/components/common/CheckboxBox.tsx

import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useTheme, Icon } from "react-native-paper";

type Props = {
  checked: boolean;
  onPress: () => void;
};

export default function CheckboxBox({ checked, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View
        style={[
          styles.box,
          {
            borderColor: theme.colors.outline,
            backgroundColor: checked
              ? theme.colors.primary
              : theme.colors.background,
          },
        ]}
      >
        {checked && (
            <Icon
            source="check"
            size={16}
            color={theme.colors.onPrimary}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 4,
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
