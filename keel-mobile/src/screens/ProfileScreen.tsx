//keel-mobile/src/screens/ProfileScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, Surface, Avatar, IconButton, useTheme, Button, TextInput, Divider, List } from "react-native-paper";
import { 
  User, Mail, Phone, Hash, Award, Ship, Edit3, Save, 
  LogOut, Globe, BookOpen, Heart, MapPin, CreditCard, Camera 
} from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

/**
 * PROFILE SCREEN — Digital ID & Official Records
 * Features: Dual-source photo upload (Camera/Gallery), editable fields, 
 * and grouped document sections.
 */
export const ProfileScreen = () => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  // Expanded Profile State (Simulating data from Keel Web)
  const [profile, setProfile] = useState({
    name: "Anuj Mengaji",
    rank: "Deck Trainee",
    vessel: "MT ARCADIA SPIRIT",
    id: "K-2026-088",
    email: "anuj@elementtree.sg",
    phone: "+91 9876543210",
    address: "7, Sunbeam, Deonar Baug",
    location: "Mumbai, Maharashtra, India",
    // Passport
    ppNo: "L1234567", ppDOI: "12/01/2022", ppDOE: "11/01/2032", ppPOI: "Mumbai",
    // CDC
    cdcNo: "MUM 112233", cdcDOI: "05/05/2023", cdcDOE: "04/05/2033", cdcPOI: "Mumbai",
    // Emergency
    nokName: "Priya Mengaji", nokRelation: "Spouse", nokPhone: "+91 9988776655"
  });

  // Function to handle Image selection from both Camera and Gallery
  const handlePhotoAction = async () => {
    Alert.alert(
      "Profile Photo",
      "Select a source for your photo",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera access is required.' });
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) setImage(result.assets[0].uri);
          }
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Gallery access is required.' });
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) setImage(result.assets[0].uri);
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSave = () => {
    setIsEditing(false);
    Toast.show({ type: 'success', text1: 'Profile Synced', text2: 'Records updated in Keel Cloud.' });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* 1. DIGITAL ID BADGE */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={[theme.colors.primary, '#0F1719']} style={styles.idCard}>
          <View style={styles.idTop}>
            <View style={styles.photoContainer}>
              {image ? (
                <Avatar.Image size={80} source={{ uri: image }} />
              ) : (
                <Avatar.Text size={80} label="AM" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} color="#FFF" />
              )}
              <TouchableOpacity style={styles.cameraBtn} onPress={handlePhotoAction} activeOpacity={0.8}>
                <Camera size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.idInfo}>
              <Text style={styles.userName}>{profile.name}</Text>
              <View style={styles.rankBadge}>
                <Award size={14} color="#4ADE80" />
                <Text style={styles.rankText}>{profile.rank}</Text>
              </View>
            </View>
          </View>
          
          <Divider style={styles.idDivider} />
          
          <View style={styles.idBottom}>
            <View style={styles.vesselBox}>
              <Ship size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.vesselName}>{profile.vessel}</Text>
            </View>
            <IconButton 
              icon={() => isEditing ? <Save color="#4ADE80" size={24} /> : <Edit3 color="#FFF" size={24} />} 
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              mode="contained"
              containerColor="rgba(255,255,255,0.1)"
            />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        
        {/* 2. CONTACT & ADDRESS */}
        <List.Accordion title="Contact & Address" left={p => <List.Icon {...p} icon="map-marker-outline" />} style={styles.accordion}>
          <Surface style={styles.infoCard} elevation={1}>
            <ProfileField label="Street Address" value={profile.address} isEditing={isEditing} icon={<MapPin size={18}/>} />
            <ProfileField label="City, State, Country" value={profile.location} isEditing={isEditing} icon={<Globe size={18}/>} />
            <ProfileField label="Phone" value={profile.phone} isEditing={isEditing} icon={<Phone size={18}/>} />
          </Surface>
        </List.Accordion>

        {/* 3. PASSPORT DETAILS */}
        <List.Accordion title="Passport Details" left={p => <List.Icon {...p} icon="passport" />} style={styles.accordion}>
          <Surface style={styles.infoCard} elevation={1}>
            <ProfileField label="Passport Number" value={profile.ppNo} isEditing={isEditing} icon={<CreditCard size={18}/>} />
            <View style={styles.row}>
              <View style={{flex: 1}}><ProfileField label="Issue Date" value={profile.ppDOI} isEditing={isEditing} /></View>
              <View style={{flex: 1}}><ProfileField label="Expiry Date" value={profile.ppDOE} isEditing={isEditing} /></View>
            </View>
            <ProfileField label="Place of Issue" value={profile.ppPOI} isEditing={isEditing} />
          </Surface>
        </List.Accordion>

        {/* 4. SEAMAN'S BOOK (CDC) */}
        <List.Accordion title="Seaman's Book (CDC)" left={p => <List.Icon {...p} icon="book-account-outline" />} style={styles.accordion}>
          <Surface style={styles.infoCard} elevation={1}>
            <ProfileField label="CDC Number" value={profile.cdcNo} isEditing={isEditing} icon={<BookOpen size={18}/>} />
            <View style={styles.row}>
              <View style={{flex: 1}}><ProfileField label="Issue Date" value={profile.cdcDOI} isEditing={isEditing} /></View>
              <View style={{flex: 1}}><ProfileField label="Expiry Date" value={profile.cdcDOE} isEditing={isEditing} /></View>
            </View>
            <ProfileField label="Place of Issue" value={profile.cdcPOI} isEditing={isEditing} />
          </Surface>
        </List.Accordion>

        {/* 5. EMERGENCY CONTACT */}
        <List.Accordion title="Emergency Contact (NOK)" left={p => <List.Icon {...p} icon="heart-outline" />} style={styles.accordion}>
          <Surface style={styles.infoCard} elevation={1}>
            <ProfileField label="Next of Kin Name" value={profile.nokName} isEditing={isEditing} icon={<User size={18}/>} />
            <ProfileField label="Relationship" value={profile.nokRelation} isEditing={isEditing} />
            <ProfileField label="Emergency Phone" value={profile.nokPhone} isEditing={isEditing} icon={<Phone size={18}/>} />
          </Surface>
        </List.Accordion>
        
        <Button 
          mode="text" 
          icon={() => <LogOut size={18} color={theme.colors.error} />}
          onPress={() => {}} 
          textColor={theme.colors.error}
          style={styles.logoutBtn}
        >
          Logout from Keel
        </Button>
      </View>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const ProfileField = ({ label, value, isEditing, onChange, icon }: any) => (
  <View style={styles.fieldRow}>
    <View style={styles.labelRow}>
      {icon && <View style={styles.fieldIcon}>{icon}</View>}
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
    {isEditing ? (
      <TextInput 
        value={value} 
        onChangeText={onChange} 
        style={styles.fieldInput} 
        dense 
        mode="flat" 
        activeUnderlineColor="#3194A0"
      />
    ) : (
      <Text style={styles.fieldValue}>{value}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { padding: 16 },
  idCard: { borderRadius: 24, padding: 24, elevation: 8 },
  idTop: { flexDirection: 'row', alignItems: 'center' },
  photoContainer: { position: 'relative' },
  cameraBtn: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    backgroundColor: '#3194A0', 
    padding: 8, 
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#0F1719'
  },
  idInfo: { marginLeft: 16 },
  userName: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  rankBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rankText: { color: '#4ADE80', marginLeft: 6, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  idDivider: { marginVertical: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  idBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vesselBox: { flexDirection: 'row', alignItems: 'center' },
  vesselName: { color: '#FFF', marginLeft: 8, fontWeight: '600', fontSize: 13 },
  content: { paddingHorizontal: 16 },
  accordion: { backgroundColor: 'transparent', paddingHorizontal: 0 },
  infoCard: { borderRadius: 16, overflow: 'hidden', padding: 12, marginBottom: 8, backgroundColor: '#FFF' },
  fieldRow: { paddingVertical: 8, paddingHorizontal: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  fieldIcon: { marginRight: 6, opacity: 0.5 },
  fieldLabel: { fontSize: 10, fontWeight: '800', opacity: 0.4, textTransform: 'uppercase' },
  fieldValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  fieldInput: { backgroundColor: 'transparent', height: 35, fontSize: 14, paddingHorizontal: 0 },
  row: { flexDirection: 'row' },
  logoutBtn: { marginTop: 20, marginBottom: 40 },
  bottomSpacer: { height: 100 }
});