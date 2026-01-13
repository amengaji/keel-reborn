import React, { useEffect, useState } from 'react';
import { Ship, MoreVertical, Search, Plus, Upload, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import AddVesselModal from '../components/vessels/AddVesselModal';
import ImportVesselModal from '../components/vessels/ImportVesselModal';
import { getVessels, saveVessel, saveAllVessels } from '../services/dataService';

interface Vessel {
  id: number;
  name: string;
  imoNumber: string;
  type: string;
  flag: string;
  classSociety?: string;
}

// HELPER: Convert CAPS to Proper Case
const toProperCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const VesselsPage: React.FC = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // STATE FOR EDITING
  const [editingVessel, setEditingVessel] = useState<Vessel | undefined>(undefined);
  // STATE FOR ACTIVE DROPDOWN
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  useEffect(() => {
    setVessels(getVessels());
  }, []);

  // CLOSE DROPDOWNS ON CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSaveVessel = (data: any) => {
    let updatedFleet;
    
    if (data.id) {
      // EDIT MODE
      updatedFleet = vessels.map(v => v.id === data.id ? { ...v, ...data } : v);
      toast.success("Vessel details updated.");
    } else {
      // ADD MODE
      const newVessel = { ...data, id: Date.now() };
      updatedFleet = [...vessels, newVessel];
      toast.success(`${newVessel.name} added to fleet.`);
    }

    saveAllVessels(updatedFleet);
    setVessels(updatedFleet);
    setEditingVessel(undefined); // Clear edit state
  };

  const handleImportVessels = (importedData: any[]) => {
    const newVessels = importedData.map((row: any, index: number) => ({
      id: Date.now() + index,
      name: toProperCase(row['Vessel Name'] || 'Unknown'), // <--- FIX: Proper Case Applied
      imoNumber: row['IMO Number'] || 'N/A',
      flag: row['Flag'] || 'Unknown',
      classSociety: row['Classification Society'] || 'Unknown',
      type: row['Vessel Type'] || 'Other'
    }));

    const updatedFleet = [...vessels, ...newVessels];
    saveAllVessels(updatedFleet);
    setVessels(updatedFleet);
    toast.success(`${newVessels.length} vessels imported successfully.`);
  };

  const deleteVessel = (id: number) => {
    const updatedFleet = vessels.filter(v => v.id !== id);
    saveAllVessels(updatedFleet);
    setVessels(updatedFleet);
    toast.info("Vessel removed from fleet.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage vessel assignments.</p>
        </div>
        <div className="flex items-center space-x-3">
           <button onClick={() => setIsImportOpen(true)} className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95">
            <Upload size={18} /><span>Import Vessels</span>
          </button>
          <button onClick={() => { setEditingVessel(undefined); setIsAddOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95">
            <Plus size={18} /><span>Add Vessel</span>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-100">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search by Name or IMO..." className="input-field pl-9" />
          </div>
        </div>

        {vessels.length > 0 ? (
          <div className="overflow-x-auto overflow-y-visible pb-20"> {/* pb-20 allows dropdown space */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border">
                  <th className="px-6 py-3">Vessel Name</th>
                  <th className="px-6 py-3">IMO Number</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Flag</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {vessels.map((vessel) => (
                  <tr key={vessel.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Ship size={16} /></div>
                      <span className="truncate max-w-37.5" title={vessel.name}>{vessel.name}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">{vessel.imoNumber}</td>
                    <td className="px-6 py-4 text-muted-foreground">{vessel.type}</td>
                    <td className="px-6 py-4 text-muted-foreground">{vessel.flag}</td>
                    <td className="px-6 py-4 text-muted-foreground">{vessel.classSociety}</td>
                    
                    {/* ACTION DROPDOWN */}
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === vessel.id ? null : vessel.id); }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeDropdown === vessel.id && (
                        <div className="absolute right-8 top-2 w-32 bg-popover border border-border rounded-md shadow-lg z-50 animate-in zoom-in-95 duration-100 overflow-hidden">
                          <button 
                            onClick={() => { setEditingVessel(vessel); setIsAddOpen(true); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Edit size={14} className="text-blue-500" /> Edit
                          </button>
                          <button 
                            onClick={() => deleteVessel(vessel.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-destructive flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h3 className="text-lg font-medium text-foreground">Fleet is Empty</h3>
          </div>
        )}
      </div>

      <AddVesselModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSave={handleSaveVessel} 
        editData={editingVessel} // Pass data for editing
      />
      <ImportVesselModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImportVessels} />
    </div>
  );
};
export default VesselsPage;