import React, { useEffect, useState } from 'react';
import { Ship, MoreVertical, Search, Plus, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AddVesselModal from '../components/vessels/AddVesselModal';
import ImportVesselModal from '../components/vessels/ImportVesselModal';

interface Vessel {
  id: number;
  name: string;
  imoNumber: string;
  type: string;
  flag: string;
  classSociety?: string;
}

const VesselsPage: React.FC = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // MOCK: Initial data load (replace with API later)
  useEffect(() => {
    // Start empty to force user to use the new buttons
    setVessels([]); 
  }, []);

  // HANDLER: Add Single Vessel
  const handleAddVessel = (data: any) => {
    const newVessel: Vessel = {
      id: Date.now(),
      name: data.name,
      imoNumber: data.imoNumber,
      type: data.type,
      flag: data.flag,
      classSociety: data.classSociety
    };
    setVessels(prev => [...prev, newVessel]);
    toast.success(`${newVessel.name} added to fleet.`);
  };

  // HANDLER: Bulk Import
  const handleImportVessels = (importedData: any[]) => {
    // Map Excel columns to our Vessel interface
    const newVessels = importedData.map((row: any, index: number) => ({
      id: Date.now() + index,
      name: row['Vessel Name'] || 'Unknown',
      imoNumber: row['IMO Number'] || 'N/A',
      flag: row['Flag'] || 'Unknown',
      classSociety: row['Classification Society'] || 'Unknown',
      type: row['Vessel Type'] || 'Other'
    }));

    setVessels(prev => [...prev, ...newVessels]);
    toast.success(`${newVessels.length} vessels imported successfully.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage vessel assignments.</p>
        </div>
        <div className="flex items-center space-x-3">
           <button 
            onClick={() => setIsImportOpen(true)}
            className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
          >
            <Upload size={18} />
            <span>Import Vessels</span>
          </button>
          
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            <span>Add Vessel</span>
          </button>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-100">
        {/* TOOLBAR */}
        <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search by Name or IMO..." 
              className="w-full bg-background pl-9 pr-4 py-2 rounded-md border border-input text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* EMPTY STATE */}
        {!loading && vessels.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
               <Ship className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Fleet is Empty</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Use the <b>Import Vessels</b> button to upload your Excel sheet or add ships manually.
            </p>
          </div>
        )}

        {/* DATA TABLE */}
        {vessels.length > 0 && (
          <div className="overflow-x-auto">
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
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        <Ship size={16} />
                      </div>
                      <span className="truncate max-w-37.5" title={vessel.name}>{vessel.name}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">{vessel.imoNumber}</td>
                    <td className="px-6 py-4 text-muted-foreground">{vessel.type}</td>
                    <td className="px-6 py-4 text-muted-foreground">{vessel.flag}</td>
                    <td className="px-6 py-4 text-muted-foreground">{vessel.classSociety}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-primary transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AddVesselModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSave={handleAddVessel} 
      />
      <ImportVesselModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImportVessels} 
      />

    </div>
  );
};

export default VesselsPage;