// keel-web/src/pages/VesselsPage.tsx

import React, { useEffect, useState } from 'react';
import { 
  Ship, Plus, Search, Upload, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUpDown, Users, AlertCircle, X 
} from 'lucide-react';
import { cadetService } from '../services/cadetService'; 
import { vesselService } from '../services/vesselService'; 
import { cadetAssignmentService } from '../services/cadetAssignmentService'; // ✅ Added
import ImportVesselModal from '../components/vessels/ImportVesselModal';
import AddVesselModal from '../components/vessels/AddVesselModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal'; 
import { toast } from 'sonner';

/**
 * VesselsPage Component
 * Manages display and CRUD for the Fleet.
 * FIXED: Trainee counts now pull from cadetAssignmentService.getActive()
 * FEATURE: Clickable Cadet Count to view specific onboard trainees.
 */
const VesselsPage: React.FC = () => {
  // State management
  const [vessels, setVessels] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]); // ✅ Added
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<any>(null); 
  
  // Crew View State
  const [viewingCrewVessel, setViewingCrewVessel] = useState<any>(null); // State for the new Quick-View modal

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    id?: string;
    name?: string;
    isDeleting?: boolean;
  }>({ isOpen: false, type: 'single' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // ✅ Now fetching active assignments alongside fleet and crew
      const [fleet, crew, activeAssignments] = await Promise.all([
        vesselService.getAll(),
        cadetService.getAll(),
        cadetAssignmentService.getActive()
      ]);
      
      setVessels(Array.isArray(fleet) ? fleet : []);
      setTrainees(Array.isArray(crew) ? crew : []);
      setAssignments(Array.isArray(activeAssignments) ? activeAssignments : []);
    } catch (error) {
      console.error("Failed to load fleet data", error);
      toast.error("Database connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  /**
   * FIXED: Count now relies on the active assignments list
   */
  const getCadetCount = (vesselId: any) => {
    if (!assignments || assignments.length === 0) return 0;
    
    // Filter assignments where vessel matches and status is ACTIVE
    return assignments.filter((a: any) => 
      String(a.vessel_id) === String(vesselId) && 
      (a.status === 'ACTIVE' || a.status === 'active')
    ).length;
  };

  /**
   * Helper to get the actual trainee objects for a specific vessel
   */
  const getOnboardTrainees = (vesselId: any) => {
    return assignments
      .filter((a: any) => String(a.vessel_id) === String(vesselId) && (a.status === 'ACTIVE' || a.status === 'active'))
      .map((a: any) => a.trainee)
      .filter(Boolean);
  };

  // --- SAVE / UPDATE ---
  const handleSaveVessel = async (data: any) => {
    try {
      const vesselPayload = {
        name: data.name,
        imo_number: data.imo || data.imo_number,
        vessel_type: data.type || data.vessel_type,
        flag: data.flag,
        class_society: data.class_society,
        is_active: data.is_active === undefined ? true : data.is_active,
        crewEmails: data.crewEmails
      };

      if (editingVessel && editingVessel.id) {
        await vesselService.update(editingVessel.id, vesselPayload);
        toast.success('Vessel records updated.');
      } else {
        await vesselService.create(vesselPayload);
        toast.success('New vessel added. Command accounts created.');
      }
      
      refreshData();
      setIsAddOpen(false);
      setEditingVessel(null);
    } catch (error) {
      console.error(error);
      toast.error("Save operation failed.");
    }
  };

  // --- DELETE HANDLERS ---
  
  const handleDeleteClick = (vessel: any) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      id: vessel.id,
      name: vessel.name,
      isDeleting: false
    });
  };

  const handleDeleteAllClick = () => {
    if (vessels.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'all',
      name: `${vessels.length} Vessels`,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      if (deleteModal.type === 'single' && deleteModal.id) {
        await vesselService.delete(deleteModal.id);
        toast.success('Vessel removed successfully.');
      } 
      else if (deleteModal.type === 'all') {
        const allIds = vessels.map(v => v.id);
        await vesselService.deleteAll(allIds);
        toast.success('All vessels have been removed.');
      }
      
      refreshData();
      setDeleteModal({ isOpen: false, type: 'single' }); 
    } catch (error: any) {
      toast.error(error.message || "Delete operation failed.");
      setDeleteModal(prev => ({ ...prev, isDeleting: false })); 
    }
  };

  const handleImport = () => {
    refreshData();
  };

  const handleEditClick = (vessel: any) => {
    setEditingVessel(vessel);
    setIsAddOpen(true);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Monitor active vessels and real-time cadet allocation.</p>
        </div>
        <div className="flex gap-2">
           {/* DELETE ALL BUTTON */}
           {vessels.length > 0 && (
             <button 
               onClick={handleDeleteAllClick}
               className="bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold text-xs uppercase tracking-wide"
             >
               <Trash2 size={16} /><span>Delete All</span>
             </button>
           )}
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

      {/* TOOLBAR */}
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

      {/* TABLE SECTION */}
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
                             <td className="p-4 text-muted-foreground truncate max-w-37.5 font-medium" title={vessel.class_society}>
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
                                {/* FEATURE: Wrapped in a clickable button to view crew */}
                                <button 
                                  onClick={() => cadetCount > 0 && setViewingCrewVessel(vessel)}
                                  className={`flex items-center gap-1.5 font-extrabold transition-all px-2 py-1 rounded-lg ${
                                    cadetCount > 0 
                                      ? 'text-primary hover:bg-primary/10 cursor-pointer' 
                                      : 'text-muted-foreground/40 cursor-default'
                                  }`}
                                >
                                   <Users size={14} />
                                   <span>{cadetCount}</span>
                                </button>
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
                                      onClick={() => handleDeleteClick(vessel)}
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false, isDeleting: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'all' ? "Delete All Vessels?" : "Delete Vessel?"}
        description={deleteModal.type === 'all' 
          ? `You are about to remove all ${vessels.length} vessels from the fleet database. This action is irreversible and will delete all associated data.`
          : "Are you sure you want to remove this vessel from the fleet? This action cannot be undone."
        }
        itemName={deleteModal.name}
        isDeleting={deleteModal.isDeleting}
        isDeleteAll={deleteModal.type === 'all'}
      />

      {/* NEW FEATURE: CREW QUICK-VIEW MODAL */}
      {viewingCrewVessel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 text-sm"><Users size={16} className="text-primary"/> Onboard Trainees</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{viewingCrewVessel.name}</p>
              </div>
              <button onClick={() => setViewingCrewVessel(null)} className="p-1.5 hover:bg-muted rounded-full transition-colors"><X size={18}/></button>
            </div>
            <div className="p-2 max-h-87.5 overflow-y-auto space-y-1">
              {getOnboardTrainees(viewingCrewVessel.id).map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-xl transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20 shrink-0 capitalize">
                    {c.first_name?.charAt(0)}{c.last_name?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{c.first_name} {c.last_name}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-extrabold tracking-widest">{c.rank || 'Trainee'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted/10 border-t border-border flex justify-end">
              <button 
                onClick={() => setViewingCrewVessel(null)} 
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground px-2 py-1 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VesselsPage;