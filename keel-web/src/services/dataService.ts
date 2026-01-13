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