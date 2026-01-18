// keel-web/src/pages/CadetsPage.tsx

import React, { useEffect, useState } from 'react';
import { 
  Users, Plus, Search, Upload, Filter, 
  Trash2, Mail, Phone, Anchor, Edit,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown
} from 'lucide-react';
import { cadetService } from '../services/cadetService'; 
import ImportCadetModal from '../components/trainees/ImportCadetModal';
import AddCadetModal from '../components/trainees/AddCadetModal';
import { toast } from 'sonner';

/**
 * CadetsPage Component
 * Provides a comprehensive interface for managing trainee (cadet) profiles.
 * FIXED: Optimized for light/dark mode using theme variables.
 * CTO RESTRICTIONS: Added role-based checks to hide Add/Import/Edit/Delete actions for CTOs.
 */
const CadetsPage: React.FC = () => {
  // --- ROLE IDENTIFICATION ---
  const userJson = localStorage.getItem('keel_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isCTO = user?.role === 'CTO'; //

  // --- STATE MANAGEMENT ---
  const [cadets, setCadets] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  
  const [isImportOpen, setIsImportOpen] = useState(false); 
  const [isAddOpen, setIsAddOpen] = useState(false); 
  const [editingCadet, setEditingCadet] = useState<any>(null); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'first_name', direction: 'asc' });

  /**
   * 1. LOAD DATA FROM API
   * Fetches the latest trainee roster from the SQL backend.
   */
  const refreshData = async () => {
    try {
      const data = await cadetService.getAll();
      setCadets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load trainees", error);
      toast.error("Could not load trainee roster from server.");
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  /**
   * 2. HANDLE SAVE (CREATE / UPDATE)
   * Processes data for new profiles or existing profile updates.
   */
  const handleSaveCadet = async (cadetData: any) => {
    try {
      // Ensure naming consistency with backend schema
      const payload = {
        ...cadetData,
        first_name: cadetData.first_name,
        last_name: cadetData.last_name,
      };

      if (editingCadet && editingCadet.id) {
        toast.info("Update logic triggered.");
        // await cadetService.update(editingCadet.id, payload);
      } else {
        await cadetService.create(payload);
        toast.success(`Trainee profile created successfully.`);
      }
      
      setIsAddOpen(false);
      setEditingCadet(null);
      refreshData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save cadet profile.");
    }
  };

  /**
   * 3. HANDLE IMPORT
   * Bulk creates trainees from imported file data.
   */
  const handleImport = async (importedData: any[]) => {
    try {
      let successCount = 0;
      toast.info(`Importing ${importedData.length} profiles...`);

      for (const cadet of importedData) {
        await cadetService.create(cadet);
        successCount++;
      }
      
      toast.success(`${successCount} trainees imported successfully.`);
      setIsImportOpen(false);
      refreshData();
    } catch (error) {
      toast.error("Import partially failed.");
    }
  };

  /**
   * 4. HANDLE DELETE
   * Removes a profile using the cascade-delete logic implemented in the backend.
   */
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this profile?')) {
      try {
        await cadetService.delete(id);
        toast.success("Trainee profile removed.");
        refreshData();
      } catch (error) {
        toast.error("Could not delete trainee.");
      }
    }
  };

  const handleEditClick = (cadet: any) => {
    setEditingCadet(cadet);
    setIsAddOpen(true);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /**
   * HELPER: Search and Filter logic
   * Dynamically handles first_name, last_name, and associated Vessel names.
   */
  const processData = () => {
    let filtered = cadets.filter((c: any) => {
      // Combine names for a comprehensive search experience
      const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      // Safely access nested vessel name from SQL response
      const vesselName = (c.vessel?.name || '').toLowerCase();
      
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                            (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.indos_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            vesselName.includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a: any, b: any) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col bg-background p-4 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold text-foreground">Trainee Management</h1>
          <p className="text-muted-foreground text-sm">
            {isCTO ? "Viewing personnel currently assigned to your vessel." : "Manage deck and engine cadets, assignments, and status."}
          </p>
        </div>

        {/* HIDE ACTIONS FOR CTO */}
        {!isCTO && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="bg-card hover:bg-muted text-foreground border border-border px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <Upload size={18} /><span>Import</span>
            </button>
            <button 
              onClick={() => { setEditingCadet(null); setIsAddOpen(true); }}
              className="bg-primary hover:brightness-110 text-primary-foreground px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg active:scale-95 font-bold"
            >
              <Plus size={18} /><span>Add Trainee</span>
            </button>
          </div>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card p-4 rounded-2xl border border-border shrink-0 shadow-sm gap-4 transition-colors">
        <div className="relative w-full md:w-80">
           <Search className="absolute left-3 top-3 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search by Name, Email or INDOS..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-10"
           />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="All">All Status</option>
                <option value="Ready">Ready</option>
                <option value="Onboard">Onboard</option>
                <option value="Leave">Leave</option>
                <option value="Training">Training</option>
              </select>
           </div>

           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span className="font-medium">Rows:</span>
             <select 
               value={itemsPerPage}
               onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
               className="bg-background border border-border text-foreground rounded-lg px-2 py-1 outline-none transition-all"
             >
               <option value={10}>10</option>
               <option value={25}>25</option>
               <option value={50}>50</option>
             </select>
           </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col transition-colors">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-muted">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/40 sticky top-0 z-10 transition-colors">
                 <tr className="border-b border-border">
                    {[
                      { label: 'Trainee Name', key: 'first_name', width: 'w-1/4' },
                      { label: 'Rank / Identity', key: 'rank', width: 'w-1/6' },
                      { label: 'Status', key: 'status', width: 'w-1/12' },
                      { label: 'Current Vessel', key: 'vessel', width: 'w-1/6' },
                      { label: 'Contact', key: 'email', width: 'w-1/5' },
                      { label: '', key: 'actions', width: 'w-12' }
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
                 {paginatedData.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="p-10 text-center text-muted-foreground font-medium">
                          {cadets.length === 0 ? "Synchronizing database records..." : "No matching trainees found."}
                       </td>
                    </tr>
                 ) : (
                    paginatedData.map((cadet: any) => (
                       <tr key={cadet.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shadow-sm">
                                    {(cadet.first_name || 'U').charAt(0)}{(cadet.last_name || '').charAt(0)}
                                </div>
                                <div className="flex flex-col gap-0">
                                   <div className="font-bold text-foreground">
                                     {cadet.first_name} {cadet.last_name}
                                   </div>
                                   <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{cadet.nationality || 'Nationality Unknown'}</div>
                                </div>
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="font-bold text-foreground/90">{cadet.rank}</div>
                             <div className="text-[10px] text-muted-foreground font-mono font-bold tracking-tighter">INDOS: {cadet.indos_number || cadet.indos || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                cadet.status === 'Onboard' ? 'bg-primary/10 text-primary border-primary/20' :
                                cadet.status === 'Ready' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                'bg-orange-500/10 text-orange-600 border-orange-500/20'
                             }`}>
                                {cadet.status || 'Ready'}
                             </span>
                          </td>
                          <td className="p-4">
                             <div className="flex items-center gap-2">
                                <Anchor size={14} className="text-muted-foreground/60" />
                                <span className={!cadet.vessel || cadet.vessel === 'Unassigned' ? 'text-muted-foreground italic text-xs' : 'text-foreground font-bold'}>
                                   {cadet.vessel?.name || 'Not Assigned'}
                                </span>
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-foreground/80 text-xs font-medium">
                                   <Mail size={12} className="shrink-0 text-muted-foreground" /> {cadet.email}
                                </div>
                                {(cadet.phone || cadet.mobile) && (
                                   <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold">
                                      <Phone size={10} className="shrink-0" /> {cadet.phone || cadet.mobile}
                                   </div>
                                )}
                             </div>
                          </td>
                          <td className="p-4 text-right">
                             {/* HIDE EDIT/DELETE ACTIONS FOR CTO */}
                             {!isCTO && (
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button 
                                    onClick={() => handleEditClick(cadet)}
                                    className="p-2 bg-background hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary border border-border shadow-xs transition-colors"
                                    title="Edit Profile"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button 
                                     onClick={() => handleDelete(cadet.id)}
                                     className="p-2 bg-background hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive border border-border shadow-xs transition-colors"
                                     title="Delete Profile"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                               </div>
                             )}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0 transition-colors">
           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Records {Math.min(processedData.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(processedData.length, currentPage * itemsPerPage)} of {processedData.length}
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
      {!isCTO && isImportOpen && (
        <ImportCadetModal 
          isOpen={isImportOpen} 
          onClose={() => setIsImportOpen(false)} 
          onImport={handleImport} 
        />
      )}

      {!isCTO && isAddOpen && (
        <AddCadetModal
          isOpen={isAddOpen}
          onClose={() => { setIsAddOpen(false); setEditingCadet(null); }}
          onSave={handleSaveCadet}
          initialData={editingCadet}
        />
      )}
    </div>
  );
};

export default CadetsPage;