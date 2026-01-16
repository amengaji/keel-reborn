//keel-mobile/src/screens/SafetyMapScreen.tsx

import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, useTheme, Surface, Button, TextInput, Menu, IconButton, Divider, ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { 
  ShieldAlert, LifeBuoy, Flame, ClipboardList, Plus, Trash2, 
  ChevronDown, Zap, Anchor, Wind, Droplets, HardHat, AlertTriangle, Activity, HeartPulse, BookOpen, Scale,
  Lock, CheckCircle2
} from "lucide-react-native";
import YesNoCapsule from "../components/common/YesNoCapsule";
import Toast from 'react-native-toast-message';

const TechnicalDropdown = ({ label, options, value, onSelect, disabled }: any) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  return (
    <View style={styles.dropdownWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Menu
        visible={visible && !disabled}
        onDismiss={() => setVisible(false)}
        anchor={
          <Surface elevation={0} style={[styles.dropdownSurface, { borderColor: theme.colors.outlineVariant }, disabled && styles.disabledSurface]}>
            <TouchableOpacity onPress={() => !disabled && setVisible(true)} style={styles.dropdownTouchable} disabled={disabled}>
              <Text style={[styles.dropdownValue, !value && { color: theme.colors.outline }]}>
                {value || `Select ${label}...`}
              </Text>
              {!disabled && <ChevronDown size={18} color={theme.colors.outline} />}
            </TouchableOpacity>
          </Surface>
        }
      >
        {options.map((opt: string) => (
          <Menu.Item key={opt} onPress={() => { onSelect(opt); setVisible(false); }} title={opt} />
        ))}
      </Menu>
    </View>
  );
};

export const SafetyMapScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  // VERIFICATION STATE (Determines if form is editable)
  const [isLocked, setIsLocked] = useState(false);

  // DYNAMIC STATE FOR MULTIPLE SYSTEMS
  const [lifeboats, setLifeboats] = useState([{ id: 1, type: '', davit: '', make: '', cap: '', dim: '' }]);
  const [liferafts, setLiferafts] = useState([{ id: 1, type: '', make: '', cap: '', release: '' }]);
  const [lifebuoys, setLifebuoys] = useState([{ id: 1, loc: '', type: '' }]);
  const [fixedSystems, setFixedSystems] = useState([{ id: 1, type: '', make: '', zones: '' }]);

  // MASTER DATA STRUCTURE BASED ON 21-POINT LIST
  const [sections, setSections] = useState([
    {
      id: 'MUSTER',
      title: '1. MUSTER & EMERGENCY ORG',
      icon: <ShieldAlert size={20} color={theme.colors.error} />,
      items: [
        { id: 'm1', name: 'Muster List Location & Personal Duties', found: null, details: { station: '', emergencyRole: '', reportTo: '' } },
        { id: 'm2', name: 'Emergency Signals (General/Fire/Abandon)', found: null, details: { understood: 'Yes' } },
        { id: 'm3', name: 'Muster Stations & Escape Routes', found: null, details: { primaryRoute: '', secondaryRoute: '' } },
      ]
    },
    {
      id: 'LSA_GENERAL',
      title: '2. PERSONAL LSA & RESCUE',
      icon: <LifeBuoy size={20} color="#3194A0" />,
      items: [
        { id: 'l3', name: 'EPIRB', found: null, details: { make: '', batteryExpiry: '', hruExpiry: '' } },
        { id: 'l4', name: 'SART (Radar/AIS)', found: null, details: { make: '', type: 'Radar' }, options: ['Radar', 'AIS'] },
        { id: 'l5', name: 'Lifejackets & Immersion Suits', found: null, details: { cabinLocation: '', sizeChecked: 'Yes' } },
      ]
    },
    {
      id: 'FFA_GENERAL',
      title: '3. FIRE SAFETY & PORTABLE FFA',
      icon: <Flame size={20} color="#F44336" />,
      items: [
        { id: 'f1', name: 'Emergency Fire Pump', found: null, details: { type: '', location: '', primeMethod: '' }, options: ['Centrifugal', 'Reciprocating', 'Screw'] },
        { id: 'f2', name: 'Portable Extinguishers & Hoses', found: null, details: { couplingType: '', nozzleType: 'Jet/Spray' }, options: ['Storz', 'Nakajima', 'John Morris', 'ANSI'] },
        { id: 'f3', name: 'EEBD & SCBA', found: null, details: { totalQty: '', make: '', pressureChecked: 'Yes' } },
        { id: 'f4', name: 'Foam Monitors', found: null, details: { location: '', capacity: '' } },
      ]
    },
    {
      id: 'MACHINERY',
      title: '4. EMERGENCY SYSTEMS & POWER',
      icon: <Zap size={20} color="#FFB300" />,
      items: [
        { id: 'e1', name: 'Emergency Generator', found: null, details: { make: '', start1: '', start2: '' }, options: ['Electric/Battery', 'Hydraulic', 'Spring/Manual', 'Air'] },
        { id: 'e2', name: 'Quick Closing Valves / Ventilation Stops', found: null, details: { location: '' } },
        { id: 'e3', name: 'Watertight Doors & Emergency Stops', found: null, details: { operationUnderstood: 'Yes' } },
      ]
    },
    {
      id: 'PROCEDURES',
      title: '5. RULES, PERMITS & ENCLOSED SPACE',
      icon: <HardHat size={20} color="#666" />,
      items: [
        { id: 's1', name: 'Permit-to-Work (Hot/Entry/Aloft)', found: null, details: { understood: 'Yes' } },
        { id: 's2', name: 'Enclosed Space Entry & Rescue', found: null, details: { permitRequired: 'Yes' } },
        { id: 's3', name: 'Drug, Alcohol & Smoking Policy', found: null, details: { understood: 'Yes' } },
      ]
    },
    {
      id: 'POLLUTION',
      title: '6. MARPOL & ENVIRONMENTAL',
      icon: <Droplets size={20} color="#2196F3" />,
      items: [
        { id: 'p1', name: 'SOPEP Locker & Spill Kits', found: null, details: { location: '' } },
        { id: 'p2', name: 'Garbage Segregation Plan', found: null, details: { plasticSegregation: 'Yes' } },
      ]
    },
    {
      id: 'MEDICAL',
      title: '7. MEDICAL & MOB',
      icon: <Activity size={20} color="#E91E63" />,
      items: [
        { id: 'h1', name: 'Hospital & First Aid Locations', found: null, details: { hospitalDeck: '' } },
        { id: 'h2', name: 'Man Overboard (MOB) Procedures', found: null, details: { actionUnderstood: 'Yes' } },
      ]
    }
  ]);

  const updateStatus = (secId: string, itemId: string, val: boolean) => {
    if (isLocked) return;
    setSections(s => s.map(sec => sec.id === secId ? { ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, found: val } : i) } : sec));
  };

  const updateDetail = (secId: string, itemId: string, key: string, val: string) => {
    if (isLocked) return;
    setSections(s => s.map(sec => sec.id === secId ? { ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, details: { ...i.details, [key]: val } } : i) } : sec));
  };

  const calculateProgress = () => {
    let totalItems = 0;
    let completedItems = 0;
    sections.forEach(s => {
      s.items.forEach(i => {
        totalItems++;
        if (i.found !== null) completedItems++;
      });
    });
    return (completedItems / totalItems) || 0;
  };

  const handleCTOVerify = () => {
    Alert.alert(
        "CTO Verification",
        "By simulating this, you act as the Chief Training Officer verifying these records. This will LOCK the safety familiarization for the trainee.",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Verify & Lock", onPress: () => {
                setIsLocked(true);
                Toast.show({ type: 'success', text1: 'Verified by CTO', text2: 'Records are now locked for compliance.' });
            }}
        ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {isLocked && (
        <Surface style={styles.lockBanner} elevation={0}>
          <Lock size={16} color="#3194A0" />
          <Text style={styles.lockText}>OFFICIAL RECORD LOCKED BY CTO</Text>
        </Surface>
      )}

      <Surface style={styles.header} elevation={1}>
        <View style={styles.headerIcon}><ClipboardList color="#FFF" size={28} /></View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Safety Familiarization</Text>
          <ProgressBar progress={calculateProgress()} color="#3194A0" style={styles.prog} />
          <Text style={styles.subtitle}>SOLAS / STCW / ISM COMPLIANT AUDIT</Text>
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
                  <Divider style={{ marginVertical: 12 }} />
                  
                  {item.id === 'l1' && (
                    <>
                      <TechnicalDropdown label="Lifeboat Type" options={item.options} value={item.details.type} onSelect={(v: any) => updateDetail(section.id, item.id, 'type', v)} disabled={isLocked} />
                      <TechnicalDropdown label="Davit Type" options={item.davitOptions} value={item.details.davit} onSelect={(v: any) => updateDetail(section.id, item.id, 'davit', v)} disabled={isLocked} />
                    </>
                  )}
                  {item.id === 'e1' && (
                    <>
                      <TechnicalDropdown label="Primary Start" options={item.options} value={item.details.start1} onSelect={(v: any) => updateDetail(section.id, item.id, 'start1', v)} disabled={isLocked} />
                      <TechnicalDropdown label="Secondary Start" options={item.options} value={item.details.start2} onSelect={(v: any) => updateDetail(section.id, item.id, 'start2', v)} disabled={isLocked} />
                    </>
                  )}
                  {item.id === 'f1' && <TechnicalDropdown label="Pump Type" options={item.options} value={item.details.type} onSelect={(v: any) => updateDetail(section.id, item.id, 'type', v)} disabled={isLocked} />}
                  {item.id === 'f2' && <TechnicalDropdown label="Coupling" options={item.options} value={item.details.couplingType} onSelect={(v: any) => updateDetail(section.id, item.id, 'couplingType', v)} disabled={isLocked} />}
                  {item.id === 'l4' && <TechnicalDropdown label="SART Type" options={item.options} value={item.details.type} onSelect={(v: any) => updateDetail(section.id, item.id, 'type', v)} disabled={isLocked} />}

                  {Object.keys(item.details).map((key) => {
                    if (['type', 'davit', 'start1', 'start2', 'couplingType'].includes(key)) return null;
                    return (
                      <TextInput key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={(item.details as any)[key]} onChangeText={(txt) => updateDetail(section.id, item.id, key, txt)} mode="outlined" dense style={styles.input} editable={!isLocked} />
                    );
                  })}
                </View>
              )}
            </Surface>
          ))}
          
          {/* LIFEBOATS ADDER */}
          {section.id === 'LSA_GENERAL' && (
            <>
              <View style={styles.dynamicHeader}>
                <Text style={styles.dynamicTitle}>Lifeboat Inventory</Text>
                {!isLocked && <IconButton icon="plus-circle" iconColor={theme.colors.primary} onPress={() => setLifeboats([...lifeboats, { id: Date.now(), type: '', davit: '', make: '', cap: '', dim: '' }])} />}
              </View>
              {lifeboats.map((lb, idx) => (
                <Surface key={lb.id} style={styles.itemCard} elevation={1}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>Lifeboat #{idx + 1}</Text>
                    {!isLocked && <IconButton icon="trash-can-outline" iconColor="red" onPress={() => setLifeboats(lifeboats.filter(l => l.id !== lb.id))} />}
                  </View>
                  <TextInput label="TYPE / DAVIT / MAKE" value={lb.make} onChangeText={(v) => { let n = [...lifeboats]; n[idx].make = v; setLifeboats(n); }} style={styles.input} mode="outlined" dense editable={!isLocked} />
                </Surface>
              ))}
            </>
          )}

          {/* LIFERAFTS ADDER */}
          {section.id === 'LSA_GENERAL' && (
            <>
              <View style={styles.dynamicHeader}>
                <Text style={styles.dynamicTitle}>Liferaft Inventory</Text>
                {!isLocked && <IconButton icon="plus-circle" iconColor={theme.colors.primary} onPress={() => setLiferafts([...liferafts, { id: Date.now(), type: '', make: '', cap: '', release: '' }])} />}
              </View>
              {liferafts.map((lr, idx) => (
                <Surface key={lr.id} style={styles.itemCard} elevation={1}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>Liferaft #{idx + 1}</Text>
                    {!isLocked && <IconButton icon="trash-can-outline" iconColor="red" onPress={() => setLiferafts(liferafts.filter(l => l.id !== lr.id))} />}
                  </View>
                  <TextInput label="TYPE / RELEASE / MAKE" value={lr.make} onChangeText={(v) => { let n = [...liferafts]; n[idx].make = v; setLiferafts(n); }} style={styles.input} mode="outlined" dense editable={!isLocked} />
                </Surface>
              ))}
            </>
          )}

          {/* LIFEBUOYS ADDER */}
          {section.id === 'LSA_GENERAL' && (
            <>
              <View style={styles.dynamicHeader}>
                <Text style={styles.dynamicTitle}>Lifebuoy Inventory</Text>
                {!isLocked && <IconButton icon="plus-circle" iconColor={theme.colors.primary} onPress={() => setLifebuoys([...lifebuoys, { id: Date.now(), loc: '', type: '' }])} />}
              </View>
              {lifebuoys.map((lb, idx) => (
                <Surface key={lb.id} style={styles.itemCard} elevation={1}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>Lifebuoy #{idx + 1}</Text>
                    {!isLocked && <IconButton icon="trash-can-outline" iconColor="red" onPress={() => setLifebuoys(lifebuoys.filter(l => l.id !== lb.id))} />}
                  </View>
                  <TextInput label="LOCATION / TYPE" value={lb.loc} onChangeText={(v) => { let n = [...lifebuoys]; n[idx].loc = v; setLifebuoys(n); }} style={styles.input} mode="outlined" dense editable={!isLocked} />
                </Surface>
              ))}
            </>
          )}

          {/* FIXED SYSTEMS ADDER */}
          {section.id === 'FFA_GENERAL' && (
            <>
              <View style={styles.dynamicHeader}>
                <Text style={styles.dynamicTitle}>Fixed Extinguishing Systems</Text>
                {!isLocked && <IconButton icon="plus-circle" iconColor={theme.colors.primary} onPress={() => setFixedSystems([...fixedSystems, { id: Date.now(), type: '', make: '', zones: '' }])} />}
              </View>
              {fixedSystems.map((sys, idx) => (
                <Surface key={sys.id} style={styles.itemCard} elevation={1}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>System #{idx + 1}</Text>
                    {!isLocked && <IconButton icon="trash-can-outline" iconColor="red" onPress={() => setFixedSystems(fixedSystems.filter(s => s.id !== sys.id))} />}
                  </View>
                  <TextInput label="TYPE (CO2 / FOAM / MIST)" value={sys.type} onChangeText={(v) => { let n = [...fixedSystems]; n[idx].type = v; setFixedSystems(n); }} style={styles.input} mode="outlined" dense editable={!isLocked} />
                  <TextInput label="ZONES COVERED" value={sys.zones} onChangeText={(v) => { let n = [...fixedSystems]; n[idx].zones = v; setFixedSystems(n); }} style={styles.input} mode="outlined" dense editable={!isLocked} />
                </Surface>
              ))}
            </>
          )}
        </View>
      ))}

      <View style={styles.footer}>
        {!isLocked ? (
          <Button mode="contained" onPress={handleCTOVerify} style={styles.submitBtn}>SIMULATE CTO SIGN-OFF</Button>
        ) : (
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.submitBtn} icon="arrow-left">RETURN TO DASHBOARD</Button>
        )}
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  lockBanner: { backgroundColor: 'rgba(49, 148, 160, 0.1)', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  lockText: { color: '#3194A0', fontSize: 11, fontWeight: '900', marginLeft: 8, letterSpacing: 1 },
  header: { padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: '#FFF' },
  headerIcon: { backgroundColor: '#3194A0', padding: 12, borderRadius: 16 },
  headerText: { marginLeft: 16, flex: 1 },
  prog: { height: 6, borderRadius: 3, marginVertical: 8 },
  title: { fontSize: 18, fontWeight: '900' },
  subtitle: { fontSize: 9, fontWeight: '800', opacity: 0.5, letterSpacing: 1 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { marginLeft: 12, fontWeight: '900', fontSize: 11, opacity: 0.6 },
  itemCard: { padding: 16, borderRadius: 20, marginBottom: 12, backgroundColor: '#FFF' },
  itemMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '800', fontSize: 14, flex: 1, color: '#333' },
  detailsGrid: { marginTop: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '800', opacity: 0.5, marginBottom: 4, marginLeft: 2 },
  dropdownWrapper: { marginBottom: 12 },
  dropdownSurface: { borderRadius: 8, borderWidth: 1, backgroundColor: '#FAFAFA' },
  disabledSurface: { opacity: 0.6, backgroundColor: '#F0F0F0' },
  dropdownTouchable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48, paddingHorizontal: 12 },
  dropdownValue: { fontSize: 14, fontWeight: '700' },
  input: { marginBottom: 12, fontSize: 13, backgroundColor: 'transparent' },
  addBtn: { borderRadius: 12, marginBottom: 12 },
  dynamicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  dynamicTitle: { fontSize: 12, fontWeight: '900', color: '#3194A0', textTransform: 'uppercase' },
  submitBtn: { borderRadius: 16, height: 56, justifyContent: 'center' },
  footer: { marginTop: 10 }
});