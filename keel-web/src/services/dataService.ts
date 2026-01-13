// KEY NAMES for LocalStorage
const VESSELS_KEY = 'keel_vessels';
const CADETS_KEY = 'keel_cadets';


// --- VESSEL OPERATIONS ---
export const getVessels = () => {
  const data = localStorage.getItem(VESSELS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveVessel = (vessel: any) => {
  const vessels = getVessels();
  vessels.push(vessel);
  localStorage.setItem(VESSELS_KEY, JSON.stringify(vessels));
  return vessels;
};

export const saveAllVessels = (vessels: any[]) => {
  localStorage.setItem(VESSELS_KEY, JSON.stringify(vessels));
};

// --- CADET OPERATIONS ---
export const getCadets = () => {
  const data = localStorage.getItem(CADETS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveCadet = (cadet: any) => {
  const cadets = getCadets();
  cadets.push(cadet);
  localStorage.setItem(CADETS_KEY, JSON.stringify(cadets));
  return cadets;
};

export const saveAllCadets = (cadets: any[]) => {
  localStorage.setItem(CADETS_KEY, JSON.stringify(cadets));
};

// --- ASSIGNMENT LOGIC ---
export const assignCadetToVessel = (cadetId: number, vesselName: string, signOnDate: string) => {
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
  saveAllCadets(updatedCadets);
  return updatedCadets;
};

export const signOffCadet = (cadetId: number, signOffDate: string, nextStatus: string) => {
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
  saveAllCadets(updatedCadets);
  return updatedCadets;
};
// ... existing imports and code ...

// NEW: Revert an assignment (Fixing a mistake)
export const undoAssignment = (cadetId: number) => {
  const cadets = getCadets();
  const updatedCadets = cadets.map((c: any) => {
    if (c.id === cadetId) {
      return { 
        ...c, 
        vessel: 'Unassigned', 
        status: 'Ready',
        signOnDate: undefined // Remove the date
      };
    }
    return c;
  });
  saveAllCadets(updatedCadets);
  return updatedCadets;
};

// ... existing code ...

const TRB_KEY = 'keel_trb_syllabus';

export const getSyllabus = () => {
  const data = localStorage.getItem(TRB_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSyllabus = (syllabus: any[]) => {
  localStorage.setItem(TRB_KEY, JSON.stringify(syllabus));
};

// CUSTOM PARSER FOR SMART TEMPLATE EXCEL FILE
export const processTRBImport = (flatData: any[]) => {
  const tree: any[] = [];
  
  // 1. CLEAN & GROUP PART NUMBERS
  // Logic: Extract just the number "1" from "1 - Navigation"
  const getPartNum = (raw: any) => {
    const str = String(raw).trim();
    // Split by dash or space and take first part, or just take the string if it's a number
    return str.split(/[\s-]+/)[0]; 
  };

  const parts = [...new Set(flatData.map(item => getPartNum(item['part_number'])))].sort();
  
  parts.forEach((partNum) => {
    // Filter rows where the part number starts with our sorted number
    const partRows = flatData.filter(r => getPartNum(r['part_number']) === partNum);
    
    // 2. Group by Topic
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
         // EVIDENCE LOGIC: Map excel value or default to DOCUMENT
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

// NEW: Delete the entire syllabus
export const clearSyllabus = () => {
  localStorage.removeItem(TRB_KEY);
};