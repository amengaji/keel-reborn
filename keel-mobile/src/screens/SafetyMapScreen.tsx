//keel-mobile/src/screens/SafetyMapScreen.tsx

import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, useTheme, Surface, Button, TextInput, Menu, IconButton, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { ShieldAlert, LifeBuoy, Flame, ClipboardList, Plus, Trash2, ChevronDown } from "lucide-react-native";
import YesNoCapsule from "../components/common/YesNoCapsule";
import Toast from 'react-native-toast-message';

/**
 * FIXED TECHNICAL DROPDOWN
 * Optimized for Left-Alignment and immediate state refresh.
 */
const TechnicalDropdown = ({ label, options, value, onSelect, style }: any) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  return (
    <View style={[styles.dropdownWrapper, style]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Surface elevation={0} style={[styles.dropdownSurface, { borderColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity onPress={() => setVisible(true)} style={styles.dropdownTouchable}>
              <Text style={[styles.dropdownValue, !value && { color: theme.colors.outline }]}>
                {value || `Select Type...`}
              </Text>
              <ChevronDown size={18} color={theme.colors.outline} />
            </TouchableOpacity>
          </Surface>
        }
      >
        {options.map((opt: string) => (
          <Menu.Item key={opt} onPress={() => { onSelect(opt); setVisible(false); }} title={opt} titleStyle={styles.menuItemText} />
        ))}
      </Menu>
    </View>
  );
};

export const SafetyMapScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  // DYNAMIC STATE FOR FIXED SYSTEMS
  const [fixedSystems, setFixedSystems] = useState([
    { id: 1, type: '', make: '', zones: '', qty: '' }
  ]);

  const FIXED_SYSTEM_TYPES = [
    'CO2 (High Pressure)', 'CO2 (Low Pressure)', 'Halon 1301', 'Hyper Mist', 
    'Low Expansion Foam', 'High Expansion Foam', 'Dry Powder', 'Novec 1230', 'FM-200', 'Water Sprinkler'
  ];

  const [sections, setSections] = useState([
    {
      id: 'MUSTER',
      title: '1. EMERGENCY STATIONS',
      icon: <ShieldAlert size={20} color={theme.colors.error} />,
      items: [
        { id: 'm1', name: 'Primary Muster Station', found: null, details: { location: '', capacity: '' } },
        { id: 'm2', name: 'Emergency Headquarters', found: null, details: { location: '', radioChannel: '' } },
      ]
    },
    { 
      id: 'LSA', 
      title: '2. LIFE SAVING APPLIANCES (LSA)', 
      icon: <LifeBuoy size={20} color="#3194A0" />,
      items: [
        { id: 'l1', name: 'Lifeboat', found: null, details: { type: '', davitType: '', make: '', capacity: '', dimensions: '' }, options: ['Totally Enclosed', 'Partially Enclosed', 'Open'], davitOptions: ['Gravity', 'Free-fall', 'Single Arm Slewing'] },
        { id: 'l2', name: 'Life Raft', found: null, details: { type: '', qty: '', capacityEach: '', make: '' }, options: ['Davit-Launch', 'Throw-over'] },
        { id: 'l3', name: 'EPIRB', found: null, details: { make: '', model: '', batteryExpiry: '', hruExpiry: '' } },
        { id: 'l4', name: 'SART', found: null, details: { make: '', model: '', batteryExpiry: '' } },
      ]
    },
    { 
      id: 'FFA', 
      title: '3. FIRE FIGHTING APPLIANCES (FFA)', 
      icon: <Flame size={20} color="#F44336" />,
      items: [
        { id: 'f1', name: 'Emergency Fire Pump', found: null, details: { pumpType: '', location: '', capacity: '' }, options: ['Centrifugal', 'Reciprocating', 'Screw', 'Vertical Turbine'] },
        { id: 'f2', name: 'EEBD', found: null, details: { totalQty: '', make: '', locations: '' } },
        { id: 'f3', name: 'SCBA Sets', found: null, details: { totalQty: '', make: '', cylinderPressure: '' } },
        { id: 'f4', name: 'Portable Fire Extinguishers', found: null, details: { types: 'CO2 / DP / Foam / Water', totalQty: '', lastService: '' } },
        { id: 'f5', name: 'Fire Hoses & Nozzles', found: null, details: { totalQty: '', length: '', nozzleType: 'Jet/Spray/Dual' } },
        { id: 'f6', name: 'Hose Couplings', found: null, details: { type: '', material: '' }, options: ['Storz', 'Nakajima', 'John Morris', 'Inst. (UK)', 'ANSI'] },
        { id: 'f7', name: 'Foam Monitors', found: null, details: { location: '', capacity: '', make: '' } },
      ]
    }
  ]);

  const updateStatus = useCallback((secId: string, itemId: string, val: boolean) => {
    setSections(s => s.map(sec => sec.id === secId ? { ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, found: val } : i) } : sec));
  }, []);

  const updateDetail = useCallback((secId: string, itemId: string, key: string, val: string) => {
    setSections(s => s.map(sec => sec.id === secId ? { ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, details: { ...i.details, [key]: val } } : i) } : sec));
  }, []);

  const updateFixedSystem = (id: number, key: string, val: string) => {
    setFixedSystems(prev => prev.map(sys => sys.id === id ? { ...sys, [key]: val } : sys));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.header} elevation={1}>
        <View style={styles.headerIcon}><ClipboardList color="#FFF" size={28} /></View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Familiarization Audit</Text>
          <Text style={styles.subtitle}>OFFICIAL TECHNICAL RECORD</Text>
        </View>
      </Surface>

      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            {section.icon}
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>

          {section.items.map((item) => (
            <Surface key={item.id} style={styles.itemCard} elevation={1}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                <YesNoCapsule value={item.found as any} onChange={(val) => updateStatus(section.id, item.id, val)} />
              </View>

              {item.found === true && (
                <View style={styles.detailsGrid}>
                  <Divider style={{ marginBottom: 16 }} />
                  {item.id === 'l1' && (
                    <>
                      <TechnicalDropdown label="Lifeboat Type" options={item.options} value={item.details.type} onSelect={(v: any) => updateDetail(section.id, item.id, 'type', v)} />
                      <TechnicalDropdown label="Davit Type" options={item.davitOptions} value={item.details.davitType} onSelect={(v: any) => updateDetail(section.id, item.id, 'davitType', v)} />
                    </>
                  )}
                  {item.id === 'l2' && <TechnicalDropdown label="Raft Type" options={item.options} value={item.details.type} onSelect={(v: any) => updateDetail(section.id, item.id, 'type', v)} />}
                  {item.id === 'f1' && <TechnicalDropdown label="Pump Type" options={item.options} value={item.details.pumpType} onSelect={(v: any) => updateDetail(section.id, item.id, 'pumpType', v)} />}
                  {item.id === 'f6' && <TechnicalDropdown label="Coupling Type" options={item.options} value={item.details.type} onSelect={(v: any) => updateDetail(section.id, item.id, 'type', v)} />}

                  <View style={styles.inputsWrapper}>
                    {Object.keys(item.details).map((key) => {
                      if (['type', 'davitType', 'pumpType'].includes(key)) return null;
                      return (
                        <TextInput key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={(item.details as any)[key]} onChangeText={(txt) => updateDetail(section.id, item.id, key, txt)} mode="outlined" dense style={styles.input} />
                      );
                    })}
                  </View>
                </View>
              )}
            </Surface>
          ))}

          {/* DYNAMIC FIXED SYSTEMS AUDIT */}
          {section.id === 'FFA' && (
            <Surface style={styles.itemCard} elevation={1}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>Fixed Fire Systems (Add All)</Text>
                <IconButton icon={() => <Plus size={20} color={theme.colors.primary}/>} onPress={() => setFixedSystems([...fixedSystems, { id: Date.now(), type: '', make: '', zones: '', qty: '' }])} />
              </View>
              
              {fixedSystems.map((sys, idx) => (
                <View key={sys.id} style={styles.fixedSystemBox}>
                  <View style={styles.multiRowHeader}>
                    <Text style={styles.subItemLabel}>SYSTEM #{idx + 1}</Text>
                    {fixedSystems.length > 1 && <IconButton icon={() => <Trash2 size={18} color={theme.colors.error}/>} onPress={() => setFixedSystems(fixedSystems.filter(s => s.id !== sys.id))} />}
                  </View>
                  
                  <TechnicalDropdown label="System Medium" options={FIXED_SYSTEM_TYPES} value={sys.type} onSelect={(v: any) => updateFixedSystem(sys.id, 'type', v)} />
                  
                  <View style={styles.inputsWrapper}>
                    <TextInput label="MAKE / MODEL" value={sys.make} onChangeText={(v) => updateFixedSystem(sys.id, 'make', v)} style={styles.input} mode="outlined" dense />
                    <TextInput label="ZONES COVERED (e.g. E/R, Pump Rm)" value={sys.zones} onChangeText={(v) => updateFixedSystem(sys.id, 'zones', v)} style={styles.input} mode="outlined" dense />
                    <TextInput label="QTY (Cylinders/Tanks/Ltrs)" value={sys.qty} onChangeText={(v) => updateFixedSystem(sys.id, 'qty', v)} style={styles.input} mode="outlined" dense />
                  </View>
                </View>
              ))}
            </Surface>
          )}
        </View>
      ))}

      <Button mode="contained" onPress={() => navigation.goBack()} style={styles.submitBtn} contentStyle={{ height: 56 }}>
        SAVE TECHNICAL AUDIT
      </Button>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: '#FFF' },
  headerIcon: { backgroundColor: '#3194A0', padding: 12, borderRadius: 16 },
  headerText: { marginLeft: 16 },
  title: { fontSize: 18, fontWeight: '900' },
  subtitle: { fontSize: 10, fontWeight: '800', opacity: 0.4, letterSpacing: 1 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { marginLeft: 12, fontWeight: '900', fontSize: 11, opacity: 0.6 },
  itemCard: { padding: 16, borderRadius: 20, marginBottom: 12, backgroundColor: '#FFF' },
  itemMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '800', fontSize: 14, flex: 1, color: '#333' },
  detailsGrid: { marginTop: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '800', opacity: 0.5, marginBottom: 4, marginLeft: 2 },
  dropdownWrapper: { marginBottom: 16 },
  dropdownSurface: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', backgroundColor: '#FAFAFA' },
  dropdownTouchable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48, paddingHorizontal: 12 },
  dropdownValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  menuItemText: { fontWeight: '600', fontSize: 14 },
  inputsWrapper: { marginTop: 8 },
  input: { marginBottom: 12, fontSize: 13, backgroundColor: 'transparent' },
  fixedSystemBox: { backgroundColor: '#FDFDFD', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', marginBottom: 16 },
  multiRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subItemLabel: { fontSize: 10, fontWeight: '900', color: '#3194A0' },
  submitBtn: { borderRadius: 16 }
});