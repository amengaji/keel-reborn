// keel-mobile/src/components/profile/PhotoCaptureModal.tsx

import React, { useState, useRef } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from "react-native";
import { Text, IconButton, Surface, useTheme, ActivityIndicator } from "react-native-paper";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Camera, X, RefreshCw, Zap, Circle } from "lucide-react-native";

const { width, height } = Dimensions.get('window');

export default function PhotoCaptureModal({ visible, onClose, onCapture }: any) {
  const theme = useTheme();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text variant="titleLarge">Camera Access Required</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
            <Text style={{color: '#FFF'}}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      onCapture(photo.uri);
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          {/* STUNNING OVERLAY MASK */}
          <View style={styles.overlay}>
             <View style={styles.unfocusedTop} />
             <View style={styles.centerRow}>
                <View style={styles.unfocusedSide} />
                <View style={styles.focusFrame} />
                <View style={styles.unfocusedSide} />
             </View>
             <View style={styles.unfocusedBottom}>
                <Text style={styles.guideText}>Position your face within the circle</Text>
             </View>
          </View>

          {/* CUSTOM CONTROLS */}
          <BlurView intensity={20} style={styles.bottomBar}>
            <IconButton icon={() => <RefreshCw color="#FFF" />} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')} />
            
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={isProcessing}>
              <View style={[styles.captureInner, { backgroundColor: theme.colors.primary }]}>
                 {isProcessing ? <ActivityIndicator color="#FFF" /> : <Camera color="#FFF" size={32} />}
              </View>
            </TouchableOpacity>

            <IconButton icon={() => <X color="#FFF" />} onPress={onClose} />
          </BlurView>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  unfocusedTop: { flex: 1 },
  centerRow: { flexDirection: 'row', height: width * 0.8 },
  unfocusedSide: { flex: 1 },
  focusFrame: { width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, borderWidth: 3, borderColor: '#4ADE80', borderStyle: 'dashed' },
  unfocusedBottom: { flex: 1, alignItems: 'center', paddingTop: 20 },
  guideText: { color: '#FFF', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: 30 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  permBtn: { marginTop: 20, backgroundColor: '#3194A0', padding: 15, borderRadius: 12 }
});