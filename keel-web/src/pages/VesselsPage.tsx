// keel-web/src/pages/VesselsPage.tsx

import React, { useEffect, useState } from 'react';
import { 
  Ship, Plus, Search, Upload, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUpDown, Users 
} from 'lucide-react';
import { cadetService } from '../services/cadetService'; 
import { vesselService } from '../services/vesselService'; 
import ImportVesselModal from '../components/vessels/ImportVesselModal';
import AddVesselModal from '../components/vessels/AddVesselModal';
import { toast } from 'sonner';

/**
 * VesselsPage Component
 * Manages display and CRUD for the Fleet.
 * FIXED: Replaced hardcoded slate classes with semantic variables (bg-card, border-border, bg-background).
 * This ensures light mode displays with a clean white background as per index.css.
 */
const VesselsPage: React.FC = () => {
  // State management for Fleet and Trainees from SQL database
  const [vessels, setVessels] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State for modals and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<any>(null); 
  
  // Pagination and Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  /**
   * Fetches fresh data from SQL Backend.
   * Calls both vessels and trainees concurrently using Promise.all for performance.
   */
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fleet, crew] = await Promise.all([
        vesselService.getAll(),
        cadetService.getAll()
      ]);

      // Normalize data arrays to prevent mapping crashes
      setVessels(Array.isArray(fleet) ? fleet : []);
      setTrainees(Array.isArray(crew) ? crew : []);
    } catch (error) {
      console.error("Failed to load fleet data", error);
      toast.error("Database connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger data fetch on initial mount
  useEffect(() => {
    refreshData();
  }, []);

  /**
   * FIXED: Calculates cadet count by matching the Vessel ID.
   * Looks at direct vessel_id property or nested assignments array from the SQL response.
   */
  const getCadetCount = (vesselId: number) => {
    return trainees.filter((t: any) => {
      // 1. Ensure the trainee is currently marked as 'Onboard'
      const isOnboard = t.status === 'Onboard';
      
      // 2. Check direct property OR nested assignments array
      const directMatch = Number(t.vessel_id) === Number(vesselId);
      const associationMatch = t.assignments?.some((a: any) => Number(a.vessel_id) === Number(vesselId) && a.status === 'ACTIVE');
      
      return isOnboard && (directMatch || associationMatch);
    }).length;
  };

  /**
   * Handles both Creating and Updating vessel records.
   */
  const handleSaveVessel = async (data: any) => {
    try {
      const vesselPayload = {
        name: data.name,
        imo_number: data.imo || data.imo_number,
        vessel_type: data.type || data.vessel_type,
        flag: data.flag,
        class_society: data.class_society,
        is_active: data.is_active === undefined ? true : data.is_active
      };

      if (editingVessel && editingVessel.id) {
        // Edit Mode: Update existing record
        await vesselService.update(editingVessel.id, vesselPayload);
        toast.success('Vessel records updated.');
      } else {
        // Add Mode: Create new record
        await vesselService.create(vesselPayload);
        toast.success('New vessel added to fleet.');
      }
      
      refreshData();
      setIsAddOpen(false);
      setEditingVessel(null);
    } catch (error) {
      console.error(error);
      toast.error("Save operation failed.");
    }
  };

  /**
   * Triggers the edit modal for a specific vessel.
   */
  const handleEditClick = (vessel: any) => {
    setEditingVessel(vessel);
    setIsAddOpen(true);
  };

  /**
   * Deletes a vessel record after confirmation.
   */
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this vessel from the database?')) {
      try {
        await vesselService.delete(id);
        toast.success('Vessel removed.');
        refreshData();
      } catch (error) {
        toast.error("Delete operation failed.");
      }
    }
  };

  /**
   * Bulk import logic for Excel/CSV data.
   */
  const handleImport = async (data: any[]) => {
    toast.info(`Importing ${data.length} vessels...`);
    for (const item of data) {
      try {
        await vesselService.create({
          name: item.name,
          imo_number: String(item.imo),
          vessel_type: item.vessel_type || "Other",
          flag: item.flag || "Unknown",
          class_society: item.class_society || "Unknown",
          is_active: true
        });
      } catch (err) { console.error("Import row failed:", err); }
    }
    toast.success("Bulk import complete.");
    refreshData();
  };

  /**
   * Sorts the data based on column keys.
   */
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /**
   * Process search, filtering, and sorting based on user input.
   */
  const processData = () => {
    let filtered = vessels.filter((v: any) => 
      (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.imo_number || '').includes(searchQuery)
    );

    filtered.sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'cadets') {
        valA = getCadetCount(a.id);
        valB = getCadetCount(b.id);
      } else {
         if (typeof valA === 'string') valA = valA.toLowerCase();
         if (typeof valB === 'string') valB = valB.toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const processedData = processData();
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col bg-background p-4 transition-colors duration-300">
      
      {/* HEADER SECTION - Theming fixed to use text-foreground */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Monitor active vessels and real-time cadet allocation.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="bg-card hover:bg-muted text-foreground border border-border px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Upload size={18} /><span>Import Fleet</span>
           </button>
           <button 
             onClick={() => { setEditingVessel(null); setIsAddOpen(true); }}
             className="bg-primary hover:brightness-110 text-primary-foreground px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg active:scale-95 font-bold"
           >
             <Plus size={18} /><span>Add Vessel</span>
           </button>
        </div>
      </div>

      {/* TOOLBAR - Replaced bg-white with bg-card */}
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shrink-0 shadow-sm transition-colors duration-300">
        <div className="relative w-80">
           <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search by Name or IMO..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-10"
           />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span className="font-medium">Rows per page:</span>
           <select 
             value={itemsPerPage}
             onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
             className="bg-background border border-border text-foreground rounded-lg px-2 py-1 outline-none transition-all cursor-pointer"
           >
             <option value={10}>10</option>
             <option value={25}>25</option>
             <option value={50}>50</option>
           </select>
        </div>
      </div>

      {/* TABLE SECTION - Semantic theming for light/dark mode compatibility */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col transition-colors duration-300">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-muted">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/40 sticky top-0 z-10 transition-colors">
                 <tr className="border-b border-border">
                    {[
                      { label: 'Vessel Name / Flag', key: 'name', width: 'w-1/4' },
                      { label: 'IMO Number', key: 'imo_number', width: 'w-1/6' },
                      { label: 'Type', key: 'vessel_type', width: 'w-1/6' },
                      { label: 'Class', key: 'class_society', width: 'w-1/6' },
                      { label: 'Status', key: 'is_active', width: 'w-1/12' },
                      { label: 'Cadets', key: 'cadets', width: 'w-1/12' },
                      { label: '', key: 'actions', width: 'w-20' }
                    ].map((col) => (
                       <th 
                         key={col.key}
                         className={`p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors ${col.width}`}
                         onClick={() => col.key !== 'actions' && handleSort(col.key)}
                       >
                         <div className="flex items-center gap-1">
                            {col.label}
                            {col.key !== 'actions' && <ArrowUpDown size={12} className={sortConfig.key === col.key ? 'text-primary' : 'opacity-30'} />}
                         </div>
                       </th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {isLoading ? (
                    <tr><td colSpan={7} className="p-10 text-center text-muted-foreground font-medium animate-pulse">Syncing with fleet database...</td></tr>
                 ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={7} className="p-10 text-center text-muted-foreground font-medium">No vessels found matching your search.</td></tr>
                 ) : (
                    paginatedData.map((vessel: any) => {
                       // Calculate real-time count using the SQL assignment matching logic
                       const cadetCount = getCadetCount(vessel.id);
                       return (
                          <tr key={vessel.id} className="hover:bg-muted/20 transition-colors group">
                             <td className="p-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                                      <Ship size={16} />
                                   </div>
                                   <div className="flex flex-col gap-0">
                                      <div className="font-bold text-foreground">{vessel.name}</div>
                                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">🏳️ {vessel.flag || 'Unknown'}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4 font-mono text-muted-foreground text-xs font-bold">{vessel.imo_number}</td>
                             <td className="p-4 text-foreground/80 font-bold">{vessel.vessel_type}</td>
                             <td className="p-4 text-muted-foreground truncate max-w-[150px] font-medium" title={vessel.class_society}>
                                {vessel.class_society || 'N/A'}
                             </td>

                             <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                   vessel.is_active 
                                   ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                   : 'bg-muted text-muted-foreground border-border'
                                }`}>
                                   {vessel.is_active ? "Active" : "Inactive"}
                                </span>
                             </td>
                             <td className="p-4">
                                <div className={`flex items-center gap-1.5 font-extrabold ${cadetCount > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                                   <Users size={14} />
                                   <span>{cadetCount}</span>
                                </div>
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                   <button 
                                     onClick={() => handleEditClick(vessel)}
                                     className="p-2 bg-background hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary border border-border shadow-xs transition-colors"
                                     title="Edit Vessel"
                                   >
                                      <Edit size={16} />
                                   </button>
                                   <button 
                                      onClick={() => handleDelete(vessel.id)}
                                      className="p-2 bg-background hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive border border-border shadow-xs transition-colors"
                                      title="Delete Vessel"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                       );
                    })
                 )}
              </tbody>
           </table>
        </div>

        {/* FOOTER / PAGINATION */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0 transition-colors duration-300">
           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {Math.min(processedData.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(processedData.length, currentPage * itemsPerPage)} of {processedData.length}
           </div>
           
           <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border disabled:opacity-30 transition-all"><ChevronsLeft size={16} /></button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
              <span className="text-xs font-bold px-4 text-foreground uppercase tracking-tight">PAGE {currentPage} / {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border disabled:opacity-30 transition-all"><ChevronsRight size={16} /></button>
           </div>
        </div>
      </div>

      {/* MODAL COMPONENTS */}
      <ImportVesselModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport} 
      />

      <AddVesselModal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); setEditingVessel(null); }}
        onSave={handleSaveVessel}
        editData={editingVessel}
      />
    </div>
  );
};

export default VesselsPage;