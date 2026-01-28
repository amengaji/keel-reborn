//keel-mobile/src/components/home/MilestoneModal.tsx

import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, Surface, Button } from "react-native-paper";
import { Award, Star, FileCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface Props {
  visible: boolean;
  onClose: () => void;
  days: number;
}

export const MilestoneModal = ({ visible, onClose, days }: Props) => {
  const isEliteMilestone = days >= 90;

  const handleDownloadPDF = () => {
    Alert.alert(
      "Certificate Generated",
      "A PDF certificate of Compliance Excellence has been generated and saved to your 'Documents' folder.",
      [{ text: "Open Folder" }, { text: "Done" }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Surface style={styles.content} elevation={5}>
          <LinearGradient colors={['#1A2426', '#111827']} style={styles.gradient}>
            <View style={[styles.iconCircle, isEliteMilestone && { borderColor: '#F59E0B' }]}>
                {isEliteMilestone ? (
                    <FileCheck color="#F59E0B" size={60} />
                ) : (
                    <Award color="#4ADE80" size={60} />
                )}
            </View>
            
            <Text style={[styles.congratsText, isEliteMilestone && { color: '#F59E0B' }]}>
                {isEliteMilestone ? "ELITE SAFETY RANK" : "MILESTONE REACHED"}
            </Text>
            <Text style={styles.streakText}>{days} DAY STREAK</Text>
            
            <Text style={styles.subText}>
                {isEliteMilestone 
                  ? "You have achieved a master-level safety streak. You are now eligible for a Professional Certificate of Excellence."
                  : `You have maintained STCW compliance for ${days} consecutive days. Remarkable consistency.`}
            </Text>

            {isEliteMilestone ? (
                <Button 
                    mode="contained" 
                    buttonColor="#F59E0B" 
                    textColor="#1A2426"
                    icon="file-pdf-box"
                    onPress={handleDownloadPDF}
                    style={styles.actionButton}
                >
                    DOWNLOAD CERTIFICATE
                </Button>
            ) : (
                <Button 
                    mode="contained" 
                    buttonColor="#4ADE80" 
                    textColor="#1A2426"
                    icon="share-variant"
                    onPress={() => {}}
                    style={styles.actionButton}
                >
                    SHARE STREAK
                </Button>
            )}

            <TouchableOpacity onPress={onClose} style={styles.closeLink}>
                <Text style={styles.closeText}>Dismiss</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  content: { width: '100%', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  gradient: { padding: 35, alignItems: 'center' },
  iconCircle: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#4ADE80'
  },
  congratsText: { color: '#4ADE80', fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  streakText: { color: '#FFF', fontSize: 42, fontWeight: '900', marginVertical: 8 },
  subText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 30, fontSize: 14 },
  actionButton: { width: '100%', borderRadius: 14, paddingVertical: 6 },
  closeLink: { marginTop: 25 },
  closeText: { color: 'rgba(255,255,255,0.4)', fontWeight: '700' }
});