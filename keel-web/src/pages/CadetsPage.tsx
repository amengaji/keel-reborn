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
 * FIXED: Now handles raw first_name and last_name from the backend for searching and display.
 */
const CadetsPage: React.FC = () => {
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
   * Dynamically handles the separation of first_name and last_name.
   */
  const processData = () => {
    let filtered = cadets.filter((c: any) => {
      // Combine names for a comprehensive search experience
      const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                            (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.indos_number || '').toLowerCase().includes(searchQuery.toLowerCase());
      
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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col dark:bg-slate-950 p-4">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trainee Management</h1>
          <p className="text-slate-500 text-sm">Manage deck and engine cadets, assignments, and status.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Upload size={18} /><span>Import</span>
           </button>
           <button 
             onClick={() => { setEditingCadet(null); setIsAddOpen(true); }}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold"
           >
             <Plus size={18} /><span>Add Trainee</span>
           </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm gap-4">
        <div className="relative w-full md:w-80">
           <Search className="absolute left-3 top-3 text-slate-400" size={16} />
           <input 
             type="text" 
             placeholder="Search by Name, Email or INDOS..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
           />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Ready">Ready</option>
                <option value="Onboard">Onboard</option>
                <option value="Leave">Leave</option>
                <option value="Training">Training</option>
              </select>
           </div>

           <div className="flex items-center gap-2 text-sm text-slate-500">
             <span>Rows:</span>
             <select 
               value={itemsPerPage}
               onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
               className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none dark:text-white"
             >
               <option value={10}>10</option>
               <option value={25}>25</option>
               <option value={50}>50</option>
             </select>
           </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                 <tr className="border-b border-slate-200 dark:border-slate-700">
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
                         className={`p-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${col.width}`}
                         onClick={() => col.key !== 'actions' && handleSort(col.key)}
                       >
                         <div className="flex items-center gap-1">
                            {col.label}
                            {col.key !== 'actions' && <ArrowUpDown size={12} className={sortConfig.key === col.key ? 'text-blue-500' : 'opacity-30'} />}
                         </div>
                       </th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {paginatedData.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="p-10 text-center text-slate-400">
                          {cadets.length === 0 ? "Synchronizing database..." : "No matches found."}
                       </td>
                    </tr>
                 ) : (
                    paginatedData.map((cadet: any) => (
                       <tr key={cadet.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-blue-800">
                                   {(cadet.first_name || 'U').charAt(0)}{(cadet.last_name || '').charAt(0)}
                                </div>
                                <div>
                                   <div className="font-bold text-slate-900 dark:text-white">
                                     {cadet.first_name} {cadet.last_name}
                                   </div>
                                   <div className="text-[10px] text-slate-500 uppercase tracking-tight">{cadet.nationality || 'Nationality Unknown'}</div>
                                </div>
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="font-semibold text-slate-700 dark:text-slate-300">{cadet.rank}</div>
                             <div className="text-[10px] text-slate-500 font-mono tracking-tighter">INDOS: {cadet.indos_number || cadet.indos || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                cadet.status === 'Onboard' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                                cadet.status === 'Ready' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                             }`}>
                                {cadet.status || 'Ready'}
                             </span>
                          </td>
                          <td className="p-4">
                             <div className="flex items-center gap-2">
                                <Anchor size={14} className="text-slate-400" />
                                <span className={!cadet.vessel || cadet.vessel === 'Unassigned' ? 'text-slate-400 italic text-xs' : 'text-slate-700 dark:text-slate-200 font-bold'}>
                                   {/* Handles nested object or string name */}
                                   {cadet.vessel?.name || cadet.vessel || 'Not Assigned'}
                                </span>
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                                   <Mail size={12} className="shrink-0" /> {cadet.email}
                                </div>
                                {(cadet.phone || cadet.mobile) && (
                                   <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                                      <Phone size={10} className="shrink-0" /> {cadet.phone || cadet.mobile}
                                   </div>
                                )}
                             </div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEditClick(cadet)}
                                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                   <Edit size={16} />
                                </button>
                                <button 
                                   onClick={() => handleDelete(cadet.id)}
                                   className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
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

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Record {Math.min(processedData.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(processedData.length, currentPage * itemsPerPage)} of {processedData.length}
           </div>
           
           <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all"><ChevronsLeft size={16} /></button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
              <span className="text-xs font-bold px-4 dark:text-white">PAGE {currentPage} / {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all"><ChevronsRight size={16} /></button>
           </div>
        </div>
      </div>

      {/* MODALS */}
      {isImportOpen && (
        <ImportCadetModal 
          isOpen={isImportOpen} 
          onClose={() => setIsImportOpen(false)} 
          onImport={handleImport} 
        />
      )}

      {isAddOpen && (
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