// amengaji/keel-reborn/keel-web/src/services/dataService.ts

// KEY NAMES for LocalStorage
const VESSELS_KEY = 'keel_vessels';
const CADETS_KEY = 'keel_cadets';
const TRB_KEY = 'keel_trb_syllabus';
const PROGRESS_KEY = 'keel_trainee_progress';
const SETTINGS_KEY = 'keel_settings';
const SHORE_USERS_KEY = 'keel_shore_users'; 
const SHORE_ROLES_KEY = 'keel_shore_roles'; 

// --- CONSTANTS ---
export const CLASSIFICATION_SOCIETIES = [
  "ABS (American Bureau of Shipping)", "BV (Bureau Veritas)", "CCS (China Classification Society)",
  "CRS (Croatian Register of Shipping)", "DNV (Det Norske Veritas)", "IRS (Indian Register of Shipping)",
  "KR (Korean Register)", "LR (Lloyd's Register)", "NK (Nippon Kaiji Kyokai)", "PRS (Polski Rejestr Statków)",
  "RINA (Registro Italiano Navale)", "RS (Russian Maritime Register)", "Other"
];

export const VESSEL_TYPES = [
  "Bulk Carrier", "Oil Tanker", "Product Tanker", "Chemical Tanker", "Gas Carrier (LNG/LPG)",
  "Container Ship", "General Cargo", "Ro-Ro / Car Carrier", "Offshore Support Vessel",
  "Passenger / Cruise", "Anchor Handling Tug", "Platform Support Vessel", "Other"
];

// --- SETTINGS DEFAULTS & OPERATIONS ---
export const DEFAULT_SETTINGS = {
  general: {
    orgName: "Keel Maritime Training",
    logo: null,
    logoWidth: 150,
    sessionTimeout: 30,
    address: "",
    country: "",
    state: "",
    city: "",
    pincode: ""
  },
  roles: [
    { id: 1, name: 'CADET', description: 'Trainee Officer', canSign: false, canUpload: true, canReview: false, canManageUsers: false, verifyLevel: 0 },
    { id: 2, name: 'CTO', description: 'Cadet Training Officer', canSign: true, canUpload: false, canReview: true, canManageUsers: false, verifyLevel: 1 },
    { id: 3, name: 'MASTER', description: 'Ship Captain', canSign: true, canUpload: false, canReview: true, canManageUsers: false, verifyLevel: 2 },
    { id: 4, name: 'SHORE_ADMIN', description: 'Office Superintendent', canSign: true, canUpload: true, canReview: true, canManageUsers: true, verifyLevel: 3 },
  ],
  rules: {
    requireEvidence: true,
    autoLock: true
  }
};

export const getSettings = () => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      general: { ...DEFAULT_SETTINGS.general, ...parsed.general },
      roles: parsed.roles || DEFAULT_SETTINGS.roles,
      rules: parsed.rules || DEFAULT_SETTINGS.rules
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: any) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('storage'));
};

// --- ROLE HELPERS (Bridge to Settings) ---
export const getRoles = () => {
  return getSettings().roles;
};

export const saveRoles = (roles: any[]) => {
  const settings = getSettings();
  settings.roles = roles;
  saveSettings(settings);
};

// --- SHORE OFFICE ROLES (ADMINISTRATION) ---
export const DEFAULT_SHORE_ROLES = [
  { 
    id: 'admin', 
    name: 'ADMIN', 
    description: 'Full System Access',
    permissions: {
      trainees: { view: true, create: true, edit: true, delete: true },
      vessels: { view: true, create: true, edit: true, delete: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: true, edit: true, delete: true },
    }
  },
  { 
    id: 'manager', 
    name: 'TRAINING MANAGER', 
    description: 'Can manage trainees and tasks, but cannot delete vessels.',
    permissions: {
      trainees: { view: true, create: true, edit: true, delete: false },
      vessels: { view: true, create: false, edit: true, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      users: { view: true, create: true, edit: false, delete: false },
    }
  },
  { 
    id: 'viewer', 
    name: 'EXECUTIVE / VIEWER', 
    description: 'Read-only access to data.',
    permissions: {
      trainees: { view: true, create: false, edit: false, delete: false },
      vessels: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
    }
  }
];

// --- SHORE ROLE OPERATIONS ---
export const getShoreRoles = () => {
  try {
    const data = localStorage.getItem(SHORE_ROLES_KEY);
    return data ? JSON.parse(data) : DEFAULT_SHORE_ROLES;
  } catch (e) {
    return DEFAULT_SHORE_ROLES;
  }
};

export const saveShoreRoles = (roles: any[]) => {
  localStorage.setItem(SHORE_ROLES_KEY, JSON.stringify(roles));
  window.dispatchEvent(new Event('storage'));
};

// --- SHORE USER OPERATIONS ---
const DEFAULT_SHORE_USERS = [
  { id: 101, firstName: 'Admin', lastName: 'User', email: 'admin@keel.com', roleId: 'admin', status: 'Active', phone: '+1 234 567 890' },
  { id: 102, firstName: 'Training', lastName: 'Manager', email: 'manager@keel.com', roleId: 'manager', status: 'Active', phone: '+1 987 654 321' }
];

export const getShoreUsers = () => {
  try {
    const data = localStorage.getItem(SHORE_USERS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SHORE_USERS;
  } catch (e) {
    return DEFAULT_SHORE_USERS;
  }
};

export const saveShoreUser = (user: any) => {
  const users = getShoreUsers();
  const existingIndex = users.findIndex((u: any) => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push({ ...user, id: Date.now() });
  }
  
  localStorage.setItem(SHORE_USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('storage'));
  return users;
};

export const deleteShoreUser = (id: number) => {
  const users = getShoreUsers().filter((u: any) => u.id !== id);
  localStorage.setItem(SHORE_USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event('storage'));
  return users;
};

// --- VESSEL IMPORT MAPPING ---
export const processVesselImport = (flatData: any[]) => {
  return flatData.map((row: any) => ({
    id: row['IMO Number'] ? `VSL-${row['IMO Number']}` : `VSL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: row['Vessel Name'] || row['name'] || 'Unknown Vessel',
    imo: String(row['IMO Number'] || row['imo'] || 'N/A'),
    flag: row['Flag'] || row['flag'] || 'Unknown',
    class_society: row['Classification Society'] || row['classSociety'] || 'Unknown',
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
    if (!Array.isArray(parsed)) return [];
    if (parsed.length > 0 && Array.isArray(parsed[0])) {
      parsed = parsed.flat();
      saveVessels(parsed);
    }
    return parsed;
  } catch (error) {
    return [];
  }
};

export const saveVessels = (vessels: any[]) => {
  localStorage.setItem(VESSELS_KEY, JSON.stringify(vessels));
  window.dispatchEvent(new Event('storage'));
};
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
      parsed = parsed.flat();
      saveCadets(parsed);
    }
    return parsed;
  } catch (error) {
    return [];
  }
};

export const saveCadets = (cadets: any[]) => {
  localStorage.setItem(CADETS_KEY, JSON.stringify(cadets));
  window.dispatchEvent(new Event('storage'));
};
export const saveAllCadets = saveCadets;

export const saveCadet = (cadet: any) => {
  const cadets = getCadets();
  cadets.push(cadet);
  saveCadets(cadets);
  return cadets;
};

// --- APPROVAL WORKFLOW OPERATIONS ---

/**
 * Scans all cadet progress to find tasks that are 'SUBMITTED' 
 * and waiting for Shore Verification.
 */
export const getApprovalQueue = () => {
  const allProgress = getAllProgress();
  const cadets = getCadets();
  const syllabus = getSyllabus();
  
  const queue: any[] = [];

  Object.keys(allProgress).forEach(cadetId => {
    // Handle both string/number ID mismatch safely
    const cadetProfile = cadets.find((c: any) => String(c.id) === String(cadetId));
    if (!cadetProfile) return;

    const userTasks = allProgress[cadetId];
    Object.keys(userTasks).forEach(taskId => {
      const taskEntry = userTasks[taskId];
      
      if (taskEntry.status === 'SUBMITTED' || taskEntry.status === 'PENDING_VERIFICATION') {
        let taskDetails: any = null;
        let funcTitle = '';
        
        syllabus.forEach((func: any) => {
            func.topics.forEach((topic: any) => {
                const t = topic.tasks.find((k: any) => k.id === taskId);
                if (t) {
                    taskDetails = t;
                    funcTitle = func.title;
                }
            });
        });

        if (taskDetails) {
            queue.push({
                uniqueId: `${cadetId}_${taskId}`,
                cadetId: String(cadetId),
                cadetName: cadetProfile.name,
                vessel: cadetProfile.vessel,
                taskId: taskId,
                taskRef: taskDetails.id.split('-')[1] || 'TASK',
                taskTitle: taskDetails.title,
                function: funcTitle,
                submittedDate: taskEntry.timestamp,
                evidence: taskEntry.evidence || null,
                description: taskDetails.description,
                status: taskEntry.status
            });
        }
      }
    });
  });

  return queue.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
};

export const processApproval = (cadetId: string, taskId: string, decision: 'APPROVED' | 'REJECTED', comments: string) => {
  const all = getAllProgress();
  if (!all[cadetId] || !all[cadetId][taskId]) return;

  const entry = all[cadetId][taskId];
  entry.status = decision === 'APPROVED' ? 'COMPLETED' : 'RETURNED';
  entry.verifiedBy = "Shore Admin";
  entry.verifiedDate = new Date().toISOString();
  entry.shoreComments = comments;

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('storage'));
};

// NEW: Batch Processing
export const processBatchApproval = (cadetId: string, taskIds: string[], decision: 'APPROVED' | 'REJECTED', comments: string) => {
  const all = getAllProgress();
  if (!all[cadetId]) return;

  taskIds.forEach(taskId => {
    if (all[cadetId][taskId]) {
      const entry = all[cadetId][taskId];
      entry.status = decision === 'APPROVED' ? 'COMPLETED' : 'RETURNED';
      entry.verifiedBy = "Shore Admin";
      entry.verifiedDate = new Date().toISOString();
      entry.shoreComments = comments;
    }
  });

  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('storage'));
};

// --- ASSIGNMENT LOGIC ---
export const assignCadetToVessel = (cadetId: any, vesselName: string, signOnDate: string) => {
  const cadets = getCadets();
  const updatedCadets = cadets.map((c: any) => {
    if (c.id === cadetId) {
      return { ...c, vessel: vesselName, status: 'Onboard', signOnDate: signOnDate };
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
      return { ...c, vessel: '', status: 'Ready', signOnDate: undefined };
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
        ...c, vessel: 'Unassigned', status: nextStatus, 
        lastVessel: c.vessel, signOffDate: signOffDate
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
       const tasks = taskRows.map((row: any) => ({
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
    tree.push({ id: `FUNC-${partNum}`, title: `Function ${partNum}`, topics: topics });
  });
  return tree;
};

// --- PROGRESS OPERATIONS ---
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

export const updateTaskStatus = (cadetId: string, taskId: string, status: string, details: any = {}) => {
  const all = getAllProgress();
  if (!all[cadetId]) all[cadetId] = {};
  
  all[cadetId][taskId] = { status, timestamp: new Date().toISOString(), ...details };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('storage'));
};