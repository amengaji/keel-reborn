// keel-mobile/src/screens/ProfileScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Image, Modal, Alert } from "react-native";
import {
  Text,
  useTheme,
  Surface,
  Avatar,
  IconButton,
  Divider,
  TextInput,
  Button,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { 
  ShieldCheck, User, Mail, Anchor, Phone, 
  MapPin, FileText, Siren, Camera, Plus, Trash2, 
  Fingerprint, Info, Image as ImageIcon, X
} from "lucide-react-native";

import { KeelScreen } from "../components/ui/KeelScreen";
import { useAuth } from "../auth/AuthContext";
import DateInputField from "../components/inputs/DateInputField";
import PhotoCaptureModal from "../components/profile/PhotoCaptureModal";
import { RELATIONSHIPS } from "../constants/maritime"; // FIXED: Local import

const { width } = Dimensions.get('window');

/**
 * PIXEL-PERFECT TEAL CARD
 * Standardized padding: 24px Top/Bottom, 20px Left/Right.
 */
const ProfileTealCard = ({ children }: { children: React.ReactNode }) => (
  <Surface style={styles.tealCard} elevation={0}>{children}</Surface>
);

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, updateUser } = useAuth();
  
  const [cameraVisible, setCameraVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [mobiles, setMobiles] = useState<string[]>(user?.mobileNumbers || [""]);

  const relationshipData = RELATIONSHIPS.map(rel => ({ label: rel, value: rel }));

  const handleCapture = (uri: string) => {
    if (updateUser) updateUser({ profileImage: uri });
  };

  const pickFromGallery = async () => {
    setMenuVisible(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && updateUser) {
      updateUser({ profileImage: result.assets[0].uri });
    }
  };

  const handleUpdateField = (field: string, value: any) => {
    if (updateUser) updateUser({ [field]: value });
  };

  const addMobile = () => setMobiles([...mobiles, ""]);
  const removeMobile = (index: number) => {
    const newMobiles = mobiles.filter((_, i) => i !== index);
    setMobiles(newMobiles);
    handleUpdateField('mobileNumbers', newMobiles);
  };

  return (
    <KeelScreen>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* 1) IDENTITY HERO (STUNNING TEAL GRADIENT) */}
        <Surface style={styles.heroWrapper} elevation={0}>
          <LinearGradient colors={['#3194A0', '#0A1214']} style={styles.heroGradient}>
            <View style={styles.heroTopRow}>
              <View style={styles.photoContainer}>
                <TouchableOpacity onPress={() => setMenuVisible(true)} activeOpacity={0.9}>
                  {user?.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.profileImg} />
                  ) : (
                    <Avatar.Text size={100} label={user?.name?.substring(0, 2).toUpperCase() || "C"} style={styles.avatar} />
                  )}
                  <Surface style={styles.editIconSurface} elevation={4}><Camera size={18} color="#FFF" /></Surface>
                </TouchableOpacity>
              </View>
              <View style={styles.heroHeaderInfo}>
                <View style={styles.technicalBadge}>
                  <Anchor size={12} color="#4ADE80" />
                  <Text style={styles.badgeText}>{user?.category?.toUpperCase() || "TRAINEE"}</Text>
                </View>
                <Text style={styles.heroName}>{user?.name || "Cadet Name"}</Text>
                <Text style={styles.heroSub}>INDOS: {user?.indosNo || "-------"}</Text>
              </View>
            </View>
            <Divider style={styles.heroDivider} />
            <View style={styles.statusRow}>
              <View style={styles.statusItem}><ShieldCheck size={14} color="#4ADE80" /><Text style={styles.statusText}>VERIFIED</Text></View>
              <View style={styles.statusItem}><Fingerprint size={14} color="#FFF" /><Text style={styles.statusText}>BIOMETRICS</Text></View>
              <View style={styles.statusItem}><Info size={14} color="#FFF" /><Text style={styles.statusText}>SYNCED</Text></View>
            </View>
          </LinearGradient>
        </Surface>

        {/* 2) PERSONAL PARTICULARS (TEAL CARD) */}
        <SectionHeader icon={<User size={18} color="#3194A0" />} title="PERSONAL PARTICULARS" />
        <ProfileTealCard>
          <TextInput label="Full Name" value={user?.name} onChangeText={(v) => handleUpdateField('name', v)} mode="outlined" dense style={styles.input} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
          <View style={styles.row}>
             <View style={{flex: 1, marginRight: 8}}>
                <DateInputField label="Date of Birth" value={user?.dob ? new Date(user.dob) : null} onChange={(d) => handleUpdateField('dob', d?.toISOString())} />
             </View>
             <View style={{flex: 1}}>
                <TextInput label="Place of Birth" value={user?.pob} onChangeText={(v) => handleUpdateField('pob', v)} mode="outlined" dense style={styles.input} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
             </View>
          </View>
          <TextInput label="Permanent Address" multiline numberOfLines={3} value={user?.address} onChangeText={(v) => handleUpdateField('address', v)} mode="outlined" style={styles.input} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
          <View style={styles.row}>
            <TextInput label="Country" value={user?.country} onChangeText={(v) => handleUpdateField('country', v)} mode="outlined" dense style={[styles.input, {flex: 1, marginRight: 8}]} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
            <TextInput label="State" value={user?.state} onChangeText={(v) => handleUpdateField('state', v)} mode="outlined" dense style={[styles.input, {flex: 1}]} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
          </View>
          <TextInput label="City" value={user?.city} onChangeText={(v) => handleUpdateField('city', v)} mode="outlined" dense style={styles.input} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
        </ProfileTealCard>

        {/* 3) CONTACT DETAILS (TEAL CARD) */}
        <SectionHeader icon={<Phone size={18} color="#3194A0" />} title="CONTACT DETAILS" />
        <ProfileTealCard>
          {mobiles.map((num, idx) => (
            <View key={idx} style={styles.row}>
              <TextInput label={`Mobile ${idx + 1}`} value={num} onChangeText={(v) => { const n = [...mobiles]; n[idx] = v; setMobiles(n); handleUpdateField('mobileNumbers', n); }} mode="outlined" dense style={[styles.input, {flex: 1}]} keyboardType="phone-pad" activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
              {idx > 0 && <IconButton icon={() => <Trash2 size={18} color={theme.colors.error} />} onPress={() => removeMobile(idx)} />}
            </View>
          ))}
          <Button icon="plus" mode="text" onPress={addMobile} textColor="#3194A0">Add Number</Button>
          <TextInput label="Email Address" value={user?.email} mode="outlined" dense style={styles.input} disabled outlineColor="rgba(49, 148, 160, 0.1)" />
        </ProfileTealCard>

        {/* 4) STATUTORY DOCUMENTS (TEAL CARD) */}
        <SectionHeader icon={<FileText size={18} color="#3194A0" />} title="STATUTORY DOCUMENTS" />
        <ProfileTealCard>
          <Text style={styles.subLabel}>PASSPORT</Text>
          <TextInput label="Passport Number" value={user?.passportNo} onChangeText={(v) => handleUpdateField('passportNo', v)} mode="outlined" dense style={styles.input} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
          <View style={styles.row}>
             <View style={{flex: 1, marginRight: 8}}><DateInputField label="DOI" value={user?.passportDoi ? new Date(user.passportDoi) : null} onChange={(d) => handleUpdateField('passportDoi', d?.toISOString())} /></View>
             <View style={{flex: 1}}><DateInputField label="DOE" value={user?.passportDoe ? new Date(user.passportDoe) : null} onChange={(d) => handleUpdateField('passportDoe', d?.toISOString())} /></View>
          </View>
          <Divider style={styles.cardDivider} />
          <Text style={styles.subLabel}>SEAMAN'S BOOK (CDC)</Text>
          <TextInput label="CDC Number" value={user?.sbNo} onChangeText={(v) => handleUpdateField('sbNo', v)} mode="outlined" dense style={styles.input} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
          <Divider style={styles.cardDivider} />
          <View style={styles.row}>
             <TextInput label="SID" value={user?.sidNo} onChangeText={(v) => handleUpdateField('sidNo', v)} mode="outlined" dense style={[styles.input, {flex: 1, marginRight: 8}]} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
             <TextInput label="INDOS" value={user?.indosNo} onChangeText={(v) => handleUpdateField('indosNo', v)} mode="outlined" dense style={[styles.input, {flex: 1}]} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
          </View>
        </ProfileTealCard>

        {/* 5) EMERGENCY CONTACT (TEAL CARD + SEARCHABLE DROPDOWN) */}
        <SectionHeader icon={<Siren size={18} color="#FF5252" />} title="EMERGENCY CONTACT (NOK)" />
        <ProfileTealCard>
          <TextInput label="NOK Full Name" value={user?.nokName} onChangeText={(v) => handleUpdateField('nokName', v)} mode="outlined" dense style={styles.input} activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
          
          <Text style={styles.dropdownLabel}>RELATIONSHIP</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={relationshipData}
            search
            labelField="label"
            valueField="value"
            placeholder="Select Relation"
            value={user?.nokRelation}
            onChange={item => handleUpdateField('nokRelation', item.value)}
            renderLeftIcon={() => <User color="#3194A0" size={18} style={{marginRight: 10}} />}
          />

          <TextInput label="Contact Number" value={user?.nokContact} onChangeText={(v) => handleUpdateField('nokContact', v)} mode="outlined" dense style={[styles.input, {marginTop: 16}]} keyboardType="phone-pad" activeOutlineColor="#3194A0" outlineColor="rgba(49, 148, 160, 0.2)" />
        </ProfileTealCard>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CUSTOM MODALS */}
      <PhotoCaptureModal visible={cameraVisible} onClose={() => setCameraVisible(false)} onCapture={handleCapture} />
      <Modal visible={menuVisible} transparent animationType="slide">
        <View style={styles.menuOverlay}>
          <BlurView intensity={90} tint="dark" style={styles.menuContent}>
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitle}>UPDATE PROFILE PHOTO</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => {setCameraVisible(true); setMenuVisible(false);}}>
              <View style={[styles.menuIconBox, { backgroundColor: '#3194A0' }]}><Camera size={22} color="#FFF" /></View>
              <Text style={styles.menuItemText}>Take New Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={pickFromGallery}>
              <View style={[styles.menuIconBox, { backgroundColor: '#4ADE80' }]}><ImageIcon size={22} color="#FFF" /></View>
              <Text style={styles.menuItemText}>Choose from Library</Text>
            </TouchableOpacity>
            <Button mode="text" onPress={() => setMenuVisible(false)} textColor="#FF5252">CLOSE</Button>
          </BlurView>
        </View>
      </Modal>
    </KeelScreen>
  );
}

const SectionHeader = ({ icon, title }: any) => (
  <View style={styles.sectionHeader}>{icon}<Text style={styles.sectionHeaderText}>{title}</Text></View>
);

const styles = StyleSheet.create({
  scrollContainer: { padding: 16 },
  heroWrapper: { borderRadius: 32, overflow: 'hidden', marginBottom: 24 },
  heroGradient: { padding: 24 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center' },
  photoContainer: { position: 'relative' },
  profileImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#FFF' },
  avatar: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  editIconSurface: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#3194A0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#0A1214' },
  heroHeaderInfo: { marginLeft: 20, flex: 1 },
  technicalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74, 222, 128, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 8 },
  badgeText: { color: '#4ADE80', fontSize: 10, fontWeight: '900', marginLeft: 6 },
  heroName: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  heroDivider: { backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { flexDirection: 'row', alignItems: 'center' },
  statusText: { color: '#FFF', fontSize: 9, fontWeight: '800', marginLeft: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12, marginLeft: 4 },
  sectionHeaderText: { fontSize: 11, fontWeight: '900', color: '#3194A0', letterSpacing: 1.5, marginLeft: 10 },
  
  // PIXEL PERFECT TEAL CARD
  tealCard: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 24, marginBottom: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: 'rgba(49, 148, 160, 0.2)' },
  input: { marginBottom: 16, backgroundColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center' },
  subLabel: { fontSize: 10, fontWeight: '900', opacity: 0.5, marginBottom: 12, textTransform: 'uppercase' },
  cardDivider: { marginVertical: 15, opacity: 0.3 },
  // Dropdown
  dropdown: { height: 50, borderColor: 'rgba(49, 148, 160, 0.2)', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 15 },
  dropdownLabel: { fontSize: 10, fontWeight: '900', opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', color: '#3194A0' },
  placeholderStyle: { fontSize: 14, color: 'rgba(0,0,0,0.3)' },
  selectedTextStyle: { fontSize: 14, fontWeight: '700', color: '#3194A0' },
  // Menu
  menuOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  menuContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  menuHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  menuTitle: { fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 24, color: 'rgba(255,255,255,0.5)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 20 },
  menuIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuItemText: { color: '#FFF', marginLeft: 16, fontSize: 16, fontWeight: '700' }
});