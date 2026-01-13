import React, { useState } from 'react';
import { Users, Plus, Search, Filter, MoreVertical, Anchor, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AddCadetModal from '../components/cadets/AddCadetModal';
import ImportCadetModal from '../components/cadets/ImportCadetModal';

// Define the shape of a Cadet Record
interface Cadet {
  id: number;
  name: string;
  rank: string;
  vessel: string;
  status: 'Onboard' | 'Leave' | 'Ready' | 'Training';
  nationality: string;
  email: string;
}

const CadetsPage: React.FC = () => {
  // STATE MANAGEMENT
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // HANDLER: Add Single Cadet (Manual)
  const handleAddCadet = (data: any) => {
    const newCadet: Cadet = {
      id: Date.now(),
      name: data.fullName,
      rank: data.traineeType || 'Cadet',
      vessel: 'Unassigned', // Default state
      status: 'Ready',      // Default state
      nationality: data.country || 'Unknown',
      email: data.email
    };
    setCadets(prev => [...prev, newCadet]);
    toast.success(`Profile created for ${newCadet.name}`);
  };

  // HANDLER: Import Cadets (Excel)
  const handleImportCadets = (importedData: any[]) => {
    const newCadets = importedData.map((row: any, index: number) => ({
      id: Date.now() + index,
      name: row['Full Name'] || 'Unknown',
      rank: row['Trainee Type'] || 'Cadet',
      vessel: 'Unassigned',
      status: 'Ready' as const,
      nationality: row['Nationality'] || 'Unknown',
      email: row['Email'] || 'N/A'
    }));
    
    setCadets(prev => [...prev, ...newCadets]);
    toast.success(`${newCadets.length} cadet profiles imported.`);
  };

  // HANDLER: Delete Cadet
  const handleDelete = (id: number) => {
    setCadets(prev => prev.filter(c => c.id !== id));
    toast.info("Cadet profile removed.");
  };

  // FILTER LOGIC
  const filteredCadets = cadets.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadet Profiles</h1>
          <p className="text-muted-foreground text-sm">Manage trainee personnel, documents, and assignments.</p>
        </div>
        <div className="flex items-center space-x-3">
           <button 
            onClick={() => setIsImportOpen(true)}
            className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
          >
            <Upload size={18} />
            <span>Import Excel</span>
          </button>
          
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            <span>New Cadet</span>
          </button>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-[400px]">
        {/* TOOLBAR */}
        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search by Name or Email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background pl-9 pr-4 py-2 rounded-md border border-input text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>
          <button className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-md transition-colors text-sm border border-transparent hover:border-border">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        {/* EMPTY STATE */}
        {cadets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
               <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No Cadets Found</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Your crew roster is empty. Import from Excel or add a new trainee manually.
            </p>
          </div>
        )}

        {/* DATA TABLE */}
        {cadets.length > 0 && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border">
                <th className="px-6 py-4">Cadet Name</th>
                <th className="px-6 py-4">Rank / Batch</th>
                <th className="px-6 py-4">Current Vessel</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredCadets.map((cadet) => (
                <tr key={cadet.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4 font-medium text-foreground flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {cadet.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{cadet.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cadet.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {cadet.rank}
                    <div className="text-[10px] opacity-70">{cadet.nationality}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground flex items-center space-x-2">
                     {cadet.vessel !== 'Unassigned' && <Anchor size={14} className="text-muted-foreground/70" />}
                     <span className={cadet.vessel === 'Unassigned' ? 'italic opacity-50' : ''}>{cadet.vessel}</span>
                  </td>
                  <td className="px-6 py-4">
                    {/* SEMANTIC STATUS BADGES */}
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      cadet.status === 'Onboard' ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' :
                      cadet.status === 'Ready' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' :
                      'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30'
                    }`}>
                      {cadet.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleDelete(cadet.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1" 
                      title="Delete Profile"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CONNECTIONS */}
      <AddCadetModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSave={handleAddCadet} 
      />
      
      <ImportCadetModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImportCadets} 
      />

    </div>
  );
};

export default CadetsPage;