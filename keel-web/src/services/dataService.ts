// KEY NAMES for LocalStorage
const VESSELS_KEY = 'keel_vessels';
const CADETS_KEY = 'keel_cadets';
const TRB_KEY = 'keel_trb_syllabus';
const PROGRESS_KEY = 'keel_trainee_progress';
const SETTINGS_KEY = 'keel_settings';

// --- CONSTANTS (Restored to prevent import crashes) ---
export const CLASSIFICATION_SOCIETIES = [
  "ABS (American Bureau of Shipping)",
  "BV (Bureau Veritas)",
  "CCS (China Classification Society)",
  "CRS (Croatian Register of Shipping)",
  "DNV (Det Norske Veritas)",
  "IRS (Indian Register of Shipping)",
  "KR (Korean Register)",
  "LR (Lloyd's Register)",
  "NK (Nippon Kaiji Kyokai)",
  "PRS (Polski Rejestr Statków)",
  "RINA (Registro Italiano Navale)",
  "RS (Russian Maritime Register)",
  "Other"
];

export const VESSEL_TYPES = [
  "Bulk Carrier",
  "Oil Tanker",
  "Product Tanker",
  "Chemical Tanker",
  "Gas Carrier (LNG/LPG)",
  "Container Ship",
  "General Cargo",
  "Ro-Ro / Car Carrier",
  "Offshore Support Vessel",
  "Passenger / Cruise",
  "Anchor Handling Tug",
  "Platform Support Vessel",
  "Other"
];

// --- SETTINGS DEFAULTS & OPERATIONS ---
export const DEFAULT_SETTINGS = {
  general: {
    orgName: "Keel Maritime Training",
    logo: null,       // Base64 string for the image
    logoWidth: 150,   // Display width in pixels
    sessionTimeout: 30, // In minutes
    address: "",
    country: "",
    state: "",
    city: "",
    pincode: ""
  },
  roles: [
    { id: 1, name: 'CADET', description: 'Trainee Officer', canSign: false, canUpload: true, verifyLevel: 0 },
    { id: 2, name: 'CTO', description: 'Cadet Training Officer', canSign: true, canUpload: false, verifyLevel: 1 },
    { id: 3, name: 'MASTER', description: 'Ship Captain', canSign: true, canUpload: false, verifyLevel: 2 },
    { id: 4, name: 'SHORE_ADMIN', description: 'Office Superintendent', canSign: true, canUpload: true, verifyLevel: 3 },
  ],
  rules: {
    requireEvidence: true,
    autoLock: true
  }
};

export const getSettings = () => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    // Merge with defaults to ensure all fields exist if schema updates
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: any) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('storage'));
};

// --- VESSEL IMPORT MAPPING ---
export const processVesselImport = (flatData: any[]) => {
  return flatData.map((row: any) => ({
    id: row['IMO Number'] ? `VSL-${row['IMO Number']}` : `VSL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: row['Vessel Name'] || row['name'] || 'Unknown Vessel',
    imo: String(row['IMO Number'] || row['imo'] || 'N/A'),
    flag: row['Flag'] || row['flag'] || 'Unknown',
    classSociety: row['Classification Society'] || row['classSociety'] || 'Unknown',
    type: row['Vessel Type'] || row['type'] || 'Other',
    status: 'Active',
    program: 'Cadet Training Program'
  }));
};

// --- VESSEL OPERATIONS (SAFE MODE) ---
export const getVessels = () => {
  try {
    const data = localStorage.getItem(VESSELS_KEY);
    if (!data) return [];
    
    let parsed = JSON.parse(data);
    
    // Safety check: Ensure it's an array
    if (!Array.isArray(parsed)) return [];

    // SELF-HEALING: Flatten nested arrays if corruption occurred
    if (parsed.length > 0 && Array.isArray(parsed[0])) {
      console.warn("Keel: Repaired corrupted vessel data.");
      parsed = parsed.flat();
      saveVessels(parsed);
    }
    
    return parsed;
  } catch (error) {
    console.error("Keel: Failed to load vessels", error);
    return []; // Always return array to prevent crash
  }
};

export const saveVessels = (vessels: any[]) => {
  localStorage.setItem(VESSELS_KEY, JSON.stringify(vessels));
  window.dispatchEvent(new Event('storage'));
};

// ALIAS: For compatibility with older pages
export const saveAllVessels = saveVessels;

export const saveVessel = (vessel: any) => {
  const vessels = getVessels();
  vessels.push(vessel);
  saveVessels(vessels);
  return vessels;
};

// --- CADET OPERATIONS (SAFE MODE) ---
export const getCadets = () => {
  try {
    const data = localStorage.getItem(CADETS_KEY);
    if (!data) return [];

    let parsed = JSON.parse(data);
    
    if (!Array.isArray(parsed)) return [];

    if (parsed.length > 0 && Array.isArray(parsed[0])) {
      console.warn("Keel: Repaired corrupted cadet data.");
      parsed = parsed.flat();
      saveCadets(parsed);
    }

    return parsed;
  } catch (error) {
    console.error("Keel: Failed to load cadets", error);
    return [];
  }
};

export const saveCadets = (cadets: any[]) => {
  localStorage.setItem(CADETS_KEY, JSON.stringify(cadets));
  window.dispatchEvent(new Event('storage'));
};

// ALIAS: For compatibility
export const saveAllCadets = saveCadets;

export const saveCadet = (cadet: any) => {
  const cadets = getCadets();
  cadets.push(cadet);
  saveCadets(cadets);
  return cadets;
};

// --- ASSIGNMENT LOGIC ---
export const assignCadetToVessel = (cadetId: any, vesselName: string, signOnDate: string) => {
  const cadets = getCadets();
  const updatedCadets = cadets.map((c: any) => {
    if (c.id === cadetId) {
      return { 
        ...c, 
        vessel: vesselName, 
        status: 'Onboard',
        signOnDate: signOnDate 
      };
    }
    return c;
  });
  saveCadets(updatedCadets);
  return updatedCadets;
};

export const undoAssignment = (cadetId: any) => {
  const cadets = getCadets();
  const updatedCadets = cadets.map((c: any) => {
    if (c.id === cadetId) {
      return { 
        ...c, 
        vessel: '', 
        status: 'Ready',
        signOnDate: undefined
      };
    }
    return c;
  });
  saveCadets(updatedCadets);
  return updatedCadets;
};

export const signOffCadet = (cadetId: any, signOffDate: string, nextStatus: string) => {
  const cadets = getCadets();
  const updatedCadets = cadets.map((c: any) => {
    if (c.id === cadetId) {
      return { 
        ...c, 
        vessel: 'Unassigned', 
        status: nextStatus,
        lastVessel: c.vessel,
        signOffDate: signOffDate
      };
    }
    return c;
  });
  saveCadets(updatedCadets);
  return updatedCadets;
};

// --- TRB SYLLABUS OPERATIONS ---
export const getSyllabus = () => {
  try {
    const data = localStorage.getItem(TRB_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveSyllabus = (syllabus: any[]) => {
  localStorage.setItem(TRB_KEY, JSON.stringify(syllabus));
};

export const clearSyllabus = () => {
  localStorage.removeItem(TRB_KEY);
};

// CUSTOM PARSER FOR SMART TEMPLATE EXCEL FILE
export const processTRBImport = (flatData: any[]) => {
  const tree: any[] = [];
  const getPartNum = (raw: any) => {
    const str = String(raw).trim();
    return str.split(/[\s-]+/)[0]; 
  };

  const parts = [...new Set(flatData.map(item => getPartNum(item['part_number'])))].sort();
  
  parts.forEach((partNum) => {
    const partRows = flatData.filter(r => getPartNum(r['part_number']) === partNum);
    const sections = [...new Set(partRows.map(r => r['section_name']))];
    
    const topics = sections.map((sectionName: any) => {
       const taskRows = partRows.filter(r => r['section_name'] === sectionName);
       const tasks = taskRows.map((row: any, idx: number) => ({
         id: `TASK-${partNum}-${Date.now()}-${Math.floor(Math.random()*10000)}`,
         title: row['title'],
         description: row['description'],
         instruction: row['instructions'],
         stcw: row['stcw_reference'],
         dept: row['department'],
         traineeType: row['trainee_type'],
         safety: row['safety_requirements'],
         evidence: row['evidence_type'] || 'DOCUMENT/PHOTO', 
         verification: row['verification_method'] || 'OBSERVATION',
         frequency: row['frequency'] || 'ONCE',
         mandatory: row['mandatory_for_all'] === true || row['mandatory_for_all'] === 'TRUE'
       }));

       return {
         id: `TOPIC-${String(sectionName).replace(/\s+/g, '-')}-${Math.floor(Math.random()*1000)}`,
         title: sectionName,
         tasks: tasks
       };
    });

    tree.push({
      id: `FUNC-${partNum}`,
      title: `Function ${partNum}`, 
      topics: topics
    });
  });

  return tree;
};

// --- PROGRESS OPERATIONS ---
// Structure: { cadetId: { taskId: { status: 'COMPLETED', date: '...', verifiedBy: '...' } } }

export const getAllProgress = () => {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const getCadetProgress = (cadetId: string) => {
  const all = getAllProgress();
  return all[cadetId] || {};
};

// Helper to calculate percentages
export const calculateProgressStats = (cadetId: string, syllabus: any[]) => {
  const userProgress = getCadetProgress(cadetId);
  const stats: any = { total: 0, completed: 0, functions: {} };

  syllabus.forEach(func => {
    let funcTotal = 0;
    let funcCompleted = 0;

    func.topics.forEach((topic: any) => {
      topic.tasks.forEach((task: any) => {
        funcTotal++;
        stats.total++;
        if (userProgress[task.id]?.status === 'COMPLETED') {
          funcCompleted++;
          stats.completed++;
        }
      });
    });

    stats.functions[func.id] = {
      title: func.title,
      total: funcTotal,
      completed: funcCompleted,
      percent: funcTotal === 0 ? 0 : Math.round((funcCompleted / funcTotal) * 100)
    };
  });

  stats.globalPercent = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
  return stats;
};

// We will use this later when building the Trainee Side
export const updateTaskStatus = (cadetId: string, taskId: string, status: string, details: any = {}) => {
  const all = getAllProgress();
  if (!all[cadetId]) all[cadetId] = {};
  
  all[cadetId][taskId] = {
    status,
    timestamp: new Date().toISOString(),
    ...details
  };

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('storage'));
};