import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { KeelCard } from "../ui/KeelCard";

type Props = {
  vesselName: string;
  shipType: string;
};

export const VesselCard: React.FC<Props> = ({ vesselName, shipType }) => {
  return (
    <KeelCard title="Your Vessel">
      <View>
        <Text variant="bodyMedium">Name: {vesselName}</Text>
        <Text variant="bodyMedium">Type: {shipType}</Text>
      </View>
    </KeelCard>
  );
};

const styles = StyleSheet.create({});
