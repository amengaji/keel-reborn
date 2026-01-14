import React, { useEffect, useState } from 'react';
import { 
  Users, Plus, Search, Upload, Filter, MoreVertical, 
  Trash2, Mail, Phone, Calendar, MapPin, Anchor,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown
} from 'lucide-react';
import { cadetService } from '../services/cadetService'; // <--- NEW SERVICE
import ImportCadetModal from '../components/trainees/ImportCadetModal';
import AddCadetModal from '../components/trainees/AddCadetModal';
import { toast } from 'sonner';

const CadetsPage: React.FC = () => {
  const [cadets, setCadets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // --- 1. LOAD DATA FROM API ---
  const refreshData = async () => {
    try {
      // FIX: Use cadetService instead of getCadets()
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

  // --- 2. HANDLE ADD (CREATE) ---
  const handleAddCadet = async (newCadet: any) => {
    try {
      // FIX: Use cadetService.create instead of saveCadets()
      await cadetService.create(newCadet);
      toast.success(`Cadet ${newCadet.firstName} ${newCadet.lastName} added successfully.`);
      setIsAddOpen(false);
      refreshData(); // Reload from DB
    } catch (error: any) {
      toast.error(error.message || "Failed to add cadet.");
    }
  };

  // --- 3. HANDLE IMPORT (BULK CREATE) ---
  const handleImport = async (importedData: any[]) => {
    try {
      let successCount = 0;
      // Loop through and create each cadet via API
      for (const cadet of importedData) {
        // Ensure data maps to what backend expects (firstName, lastName, etc.)
        await cadetService.create(cadet);
        successCount++;
      }
      toast.success(`${successCount} trainees imported successfully.`);
      setIsImportOpen(false);
      refreshData();
    } catch (error) {
      console.error(error);
      toast.error("Import failed. Please check the file format.");
    }
  };

  // --- 4. HANDLE DELETE ---
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

  const handleInitializeTRB = async (userId: number, department: string) => {
  if (!window.confirm(`Initialize ${department} TRB for this cadet?`)) return;
  
  try {
    const response = await fetch('http://localhost:5000/api/assignments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keel_token')}`
      },
      body: JSON.stringify({ userId, department })
    });
    
    if (response.ok) {
      toast.success("TRB Initialized successfully!");
    } else {
      toast.error("Failed to initialize TRB.");
    }
  } catch (error) {
    toast.error("Network error.");
  }
};

  // --- SORTING & FILTERING ---
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
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trainee Management</h1>
          <p className="text-muted-foreground text-sm">Manage deck and engine cadets, assignments, and status.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Upload size={18} /><span>Import Roster</span>
           </button>
           <button 
             onClick={() => setIsAddOpen(true)}
             className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Plus size={18} /><span>Add Trainee</span>
           </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card p-4 rounded-xl border border-border shrink-0 shadow-sm gap-4">
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search by Name or Email..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-9 h-9 w-full"
           />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
           <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-border rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="All">All Status</option>
                <option value="Ready">Ready</option>
                <option value="Onboard">Onboard</option>
                <option value="Leave">Leave</option>
                <option value="Training">Training</option>
              </select>
           </div>

           <div className="h-4 w-px bg-border hidden md:block"></div>

           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span className="whitespace-nowrap">Rows:</span>
             <select 
               value={itemsPerPage}
               onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
               className="bg-background border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
             >
               <option value={10}>10</option>
               <option value={25}>25</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </select>
           </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
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
                       <tr key={cadet.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                                   {cadet.name.charAt(0)}
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
                                <span className={cadet.vessel === 'Unassigned' ? 'text-muted-foreground italic' : 'text-foreground font-medium'}>
                                   {cadet.vessel}
                                </span>
                             </div>
                             {cadet.signOnDate && (
                                <div className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                                   Since: {new Date(cadet.signOnDate).toLocaleDateString()}
                                </div>
                             )}
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
                             <button 
                                onClick={() => handleDelete(cadet.id)}
                                className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Profile"
                             >
                                <Trash2 size={16} />
                             </button>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
           <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{Math.min(processedData.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="font-medium">{Math.min(processedData.length, currentPage * itemsPerPage)}</span> of <span className="font-medium">{processedData.length}</span> results
           </div>
           
           <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"><ChevronsLeft size={16} /></button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
              <span className="text-sm font-medium px-4">Page {currentPage} of {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"><ChevronsRight size={16} /></button>
           </div>
        </div>
      </div>

      <ImportCadetModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport} 
      />

      <AddCadetModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddCadet}
      />
    </div>
  );
};

export default CadetsPage;