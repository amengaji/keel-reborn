//keel-mobile/src/components/home/MilestoneModal.tsx

import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, Button, IconButton } from "react-native-paper";
import { Award, Star, Share2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface Props {
  visible: boolean;
  onClose: () => void;
  days: number;
}

export const MilestoneModal = ({ visible, onClose, days }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Surface style={styles.content} elevation={5}>
          <LinearGradient colors={['#3194A0', '#1A2426']} style={styles.gradient}>
            <View style={styles.iconCircle}>
                <Award color="#4ADE80" size={60} strokeWidth={1.5} />
            </View>
            
            <Text style={styles.congratsText}>MILESTONE REACHED</Text>
            <Text style={styles.streakText}>{days} DAY STREAK</Text>
            
            <Text style={styles.subText}>
                You have maintained STCW compliance for {days} consecutive days. 
                Your commitment to safety excellence is exemplary.
            </Text>

            <View style={styles.starRow}>
                {[1,2,3,4,5].map(i => <Star key={i} size={20} color="#F59E0B" fill="#F59E0B" />)}
            </View>

            <Button 
                mode="contained" 
                buttonColor="#4ADE80" 
                textColor="#1A2426"
                icon="share-variant"
                onPress={() => {/* Share Logic */}}
                style={styles.shareButton}
            >
                SHARE ACHIEVEMENT
            </Button>

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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  content: { width: '100%', borderRadius: 32, overflow: 'hidden' },
  gradient: { padding: 30, alignItems: 'center' },
  iconCircle: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.3)'
  },
  congratsText: { color: '#4ADE80', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  streakText: { color: '#FFF', fontSize: 36, fontWeight: '900', marginVertical: 10 },
  subText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  shareButton: { width: '100%', borderRadius: 12, paddingVertical: 4 },
  closeLink: { marginTop: 20 },
  closeText: { color: 'rgba(255,255,255,0.4)', fontWeight: '700' }
});