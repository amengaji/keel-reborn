// amengaji/keel-reborn/keel-reborn-8e3419f76262b0acdc74d700afab81401a9542d0/keel-web/src/pages/CadetsPage.tsx

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
 * Features: API-driven data loading, searching, status filtering, bulk import, and CRUD operations.
 */
const CadetsPage: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [cadets, setCadets] = useState<any[]>([]); // Full list of trainees from database
  const [searchQuery, setSearchQuery] = useState(''); // Text search state
  const [statusFilter, setStatusFilter] = useState('All'); // Dropdown filter state
  
  const [isImportOpen, setIsImportOpen] = useState(false); // Controls Import Modal visibility
  const [isAddOpen, setIsAddOpen] = useState(false); // Controls Add/Edit Modal visibility
  const [editingCadet, setEditingCadet] = useState<any>(null); // Holds data for the cadet being edited
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  /**
   * 1. LOAD DATA FROM API
   * Fetches the latest trainee roster from the server.
   */
  const refreshData = async () => {
    try {
      const data = await cadetService.getAll();
      // Ensure we always have an array even if the server returns null
      setCadets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load trainees", error);
      toast.error("Could not load trainee roster from server.");
    }
  };

  // Trigger data load on initial page render
  useEffect(() => {
    refreshData();
  }, []);

  /**
   * 2. HANDLE SAVE (CREATE / UPDATE)
   * This handles data coming back from the AddCadetModal.
   */
  const handleSaveCadet = async (cadetData: any) => {
    try {
      // Map form fields to backend schema (e.g., ensuring fullName maps to name)
      const payload = {
        ...cadetData,
        name: cadetData.fullName || cadetData.name, // Ensure naming consistency
      };

      if (editingCadet && editingCadet.id) {
        // Edit Mode: If your service supports update, call it here. 
        // For now, we reuse create or log error if service is missing update.
        toast.info("Updating existing profile...");
        // await cadetService.update(editingCadet.id, payload);
      } else {
        // Add Mode
        await cadetService.create(payload);
        toast.success(`Trainee profile created successfully.`);
      }
      
      setIsAddOpen(false);
      setEditingCadet(null);
      refreshData(); // Refresh the list from the database
    } catch (error: any) {
      toast.error(error.message || "Failed to save cadet profile.");
    }
  };

  /**
   * 3. HANDLE IMPORT (BULK CREATE)
   * Processes an array of trainees from an Excel/CSV upload.
   */
  const handleImport = async (importedData: any[]) => {
    try {
      let successCount = 0;
      toast.info(`Importing ${importedData.length} profiles...`);

      for (const cadet of importedData) {
        // Ensure keys match what backend expects (e.g. name instead of fullName)
        const payload = {
          ...cadet,
          name: cadet.name || cadet.fullName,
          status: cadet.status || 'Ready'
        };
        await cadetService.create(payload);
        successCount++;
      }
      
      toast.success(`${successCount} trainees imported successfully.`);
      setIsImportOpen(false);
      refreshData();
    } catch (error) {
      console.error(error);
      toast.error("Import partially failed. Please check file format and connection.");
    }
  };

  /**
   * 4. HANDLE DELETE
   * Removes a profile from the database.
   */
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this profile? This action cannot be undone.')) {
      try {
        await cadetService.delete(id);
        toast.success("Trainee profile removed.");
        refreshData();
      } catch (error) {
        toast.error("Could not delete trainee.");
      }
    }
  };

  /**
   * 5. EDIT TRIGGER
   * Pre-fills the modal with existing cadet data.
   */
  const handleEditClick = (cadet: any) => {
    setEditingCadet(cadet);
    setIsAddOpen(true);
  };

  // --- HELPER LOGIC: SORTING & FILTERING ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processData = () => {
    let filtered = cadets.filter((c: any) => {
      const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col dark:bg-background">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trainee Management</h1>
          <p className="text-muted-foreground text-sm">Manage deck and engine cadets, assignments, and status.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="bg-card dark:bg-muted/20 hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Upload size={18} /><span>Import Trainees</span>
           </button>
           <button 
             onClick={() => { setEditingCadet(null); setIsAddOpen(true); }}
             className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Plus size={18} /><span>Add Trainee</span>
           </button>
        </div>
      </div>

      {/* TOOLBAR: Search & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card dark:bg-muted/10 p-4 rounded-xl border border-border shrink-0 shadow-sm gap-4">
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search by Name or Email..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-9 h-9 w-full bg-background border-border"
           />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background dark:bg-muted/20 border border-border rounded px-2 py-1.5 text-sm outline-none"
              >
                <option value="All">All Status</option>
                <option value="Ready">Ready</option>
                <option value="Onboard">Onboard</option>
                <option value="Leave">Leave</option>
                <option value="Training">Training</option>
              </select>
           </div>

           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span className="whitespace-nowrap">Rows:</span>
             <select 
               value={itemsPerPage}
               onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
               className="bg-background dark:bg-muted/20 border border-border rounded px-2 py-1 outline-none"
             >
               <option value={10}>10</option>
               <option value={25}>25</option>
               <option value={50}>50</option>
             </select>
           </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-card dark:bg-muted/5 border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/50 dark:bg-muted/20 sticky top-0 z-10">
                 <tr className="border-b border-border">
                    {[
                      { label: 'Trainee Name', key: 'name', width: 'w-1/4' },
                      { label: 'Rank / Identity', key: 'rank', width: 'w-1/6' },
                      { label: 'Status', key: 'status', width: 'w-1/12' },
                      { label: 'Current Vessel', key: 'vessel', width: 'w-1/6' },
                      { label: 'Contact', key: 'email', width: 'w-1/5' },
                      { label: '', key: 'actions', width: 'w-12' }
                    ].map((col) => (
                       <th 
                         key={col.key}
                         className={`p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors ${col.width}`}
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
                       <td colSpan={6} className="p-10 text-center text-muted-foreground">
                          {cadets.length === 0 ? "Loading trainees..." : "No trainees found matching your criteria."}
                       </td>
                    </tr>
                 ) : (
                    paginatedData.map((cadet: any) => (
                       <tr key={cadet.id} className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors group">
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                                   {(cadet.name || 'U').charAt(0)}
                                </div>
                                <div>
                                   <div className="font-bold text-foreground">{cadet.name}</div>
                                   <div className="text-xs text-muted-foreground">{cadet.nationality}</div>
                                </div>
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="font-medium text-foreground">{cadet.rank}</div>
                             <div className="text-xs text-muted-foreground font-mono">{cadet.indos}</div>
                          </td>
                          <td className="p-4">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                cadet.status === 'Onboard' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                cadet.status === 'Ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                             }`}>
                                {cadet.status}
                             </span>
                          </td>
                          <td className="p-4">
                             <div className="flex items-center gap-2">
                                <Anchor size={14} className="text-muted-foreground" />
                                <span className={!cadet.vessel || cadet.vessel === 'Unassigned' ? 'text-muted-foreground italic' : 'text-foreground font-medium'}>
                                   {cadet.vessel || 'Unassigned'}
                                </span>
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="flex flex-col gap-1 text-xs">
                                <div className="flex items-center gap-2 text-foreground">
                                   <Mail size={12} className="text-muted-foreground" /> {cadet.email}
                                </div>
                                {cadet.mobile && (
                                   <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone size={12} /> {cadet.mobile}
                                   </div>
                                )}
                             </div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEditClick(cadet)}
                                  className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                                  title="Edit Profile"
                                >
                                   <Edit size={16} />
                                </button>
                                <button 
                                   onClick={() => handleDelete(cadet.id)}
                                   className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-600 transition-colors"
                                   title="Delete Profile"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-border bg-muted/20 dark:bg-muted/10 flex items-center justify-between shrink-0">
           <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{Math.min(processedData.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="font-medium">{Math.min(processedData.length, currentPage * itemsPerPage)}</span> of <span className="font-medium">{processedData.length}</span> results
           </div>
           
           <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded hover:bg-muted disabled:opacity-50"><ChevronsLeft size={16} /></button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-muted disabled:opacity-50"><ChevronLeft size={16} /></button>
              <span className="text-sm font-medium px-4">Page {currentPage} of {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded hover:bg-muted disabled:opacity-50"><ChevronRight size={16} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded hover:bg-muted disabled:opacity-50"><ChevronsRight size={16} /></button>
           </div>
        </div>
      </div>

      {/* MODAL COMPONENTS */}
      <ImportCadetModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport} 
      />

      <AddCadetModal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); setEditingCadet(null); }}
        onSave={handleSaveCadet}
        initialData={editingCadet}
      />
    </div>
  );
};

export default CadetsPage;