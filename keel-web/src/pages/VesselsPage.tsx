//keel-web/src/pages/VesselsPage.tsx

import React, { useEffect, useState } from 'react';
import { 
  Ship, Plus, Search, Upload, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUpDown, Users, AlertCircle 
} from 'lucide-react';
import { cadetService } from '../services/cadetService'; 
import { vesselService } from '../services/vesselService'; 
import ImportVesselModal from '../components/vessels/ImportVesselModal';
import AddVesselModal from '../components/vessels/AddVesselModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal'; // New Import
import { toast } from 'sonner';

/**
 * VesselsPage Component
 * Manages display and CRUD for the Fleet.
 * UPDATED: Uses custom glassmorphic Delete Modal and adds "Delete All" capability.
 */
const VesselsPage: React.FC = () => {
  // State management
  const [vessels, setVessels] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<any>(null); 
  
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
      const [fleet, crew] = await Promise.all([
        vesselService.getAll(),
        cadetService.getAll()
      ]);
      setVessels(Array.isArray(fleet) ? fleet : []);
      setTrainees(Array.isArray(crew) ? crew : []);
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

  const getCadetCount = (vesselId: number) => {
    return trainees.filter((t: any) => {
      const isOnboard = t.status === 'Onboard';
      const directMatch = Number(t.vessel_id) === Number(vesselId);
      const associationMatch = t.assignments?.some((a: any) => Number(a.vessel_id) === Number(vesselId) && a.status === 'ACTIVE');
      return isOnboard && (directMatch || associationMatch);
    }).length;
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
  
  // 1. Open Modal for Single Delete
  const handleDeleteClick = (vessel: any) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      id: vessel.id,
      name: vessel.name,
      isDeleting: false
    });
  };

  // 2. Open Modal for Delete All
  const handleDeleteAllClick = () => {
    if (vessels.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'all',
      name: `${vessels.length} Vessels`,
      isDeleting: false
    });
  };

  // 3. Confirm Logic
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
      setDeleteModal({ isOpen: false, type: 'single' }); // Reset
    } catch (error: any) {
      toast.error(error.message || "Delete operation failed.");
      setDeleteModal(prev => ({ ...prev, isDeleting: false })); // Stop loading only on error
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
                                      onClick={() => handleDeleteClick(vessel)} // Changed to use Modal Handler
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

      {/* NEW DELETE MODAL */}
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
    </div>
  );
};

export default VesselsPage;