import React, { useEffect, useState } from 'react';
import { 
  Users, Plus, Search, Upload, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUpDown, Ship, Mail, Phone 
} from 'lucide-react';
import { getCadets, saveCadets } from '../services/dataService';
import ImportCadetModal from '../components/trainees/ImportCadetModal';
import AddCadetModal from '../components/trainees/AddCadetModal';
import { toast } from 'sonner';

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const CadetsPage: React.FC = () => {
  const [cadets, setCadets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCadet, setEditingCadet] = useState<any>(null);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const data = getCadets();
    setCadets(Array.isArray(data) ? data : []);
  };

  const handleImport = (newCadets: any[]) => {
    const current = getCadets();
    const updated = [...current, ...newCadets];
    saveCadets(updated);
    setCadets(updated);
    toast.success(`${newCadets.length} trainees imported successfully.`);
  };

  const handleAdd = (cadet: any) => {
    const current = getCadets();
    if (editingCadet) {
      // FIX: Explicitly typed callback for TypeScript
      const updated = current.map((c: any) => c.id === cadet.id ? cadet : c);
      saveCadets(updated);
      setCadets(updated);
      toast.success('Trainee updated.');
    } else {
      const updated = [...current, cadet];
      saveCadets(updated);
      setCadets(updated);
      toast.success('Trainee added.');
    }
    setEditingCadet(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trainee?')) {
      const current = getCadets();
      // FIX: Explicitly typed callback
      const updated = current.filter((c: any) => c.id !== id);
      saveCadets(updated);
      setCadets(updated);
      toast.success('Trainee deleted.');
    }
  };

  const handleEdit = (cadet: any) => {
    setEditingCadet(cadet);
    setIsAddOpen(true);
  };

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // PROCESSING PIPELINE
  const processData = () => {
    let filtered = cadets.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.vessel && c.vessel.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Crew Management</h1>
          <p className="text-muted-foreground text-sm">Manage trainee profiles, ranks, and details.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Upload size={18} /><span>Import Crew</span>
           </button>
           <button 
             onClick={() => { setEditingCadet(null); setIsAddOpen(true); }}
             className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Plus size={18} /><span>Add Trainee</span>
           </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shrink-0 shadow-sm">
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search Name, Rank, Vessel..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-9 h-9"
           />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span>Rows per page:</span>
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

      {/* TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                 <tr className="border-b border-border">
                    {[
                      { label: 'Name', key: 'name', width: 'w-1/4' },
                      { label: 'Rank', key: 'rank', width: 'w-1/6' },
                      { label: 'Nationality', key: 'nationality', width: 'w-1/6' },
                      { label: 'Status / Vessel', key: 'vessel', width: 'w-1/5' },
                      { label: 'Contact', key: 'email', width: 'w-1/5' },
                      { label: 'Actions', key: 'actions', width: 'w-20' }
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
                          No trainees found matching your criteria.
                       </td>
                    </tr>
                 ) : (
                    paginatedData.map((trainee) => (
                       <tr key={trainee.id} className="hover:bg-muted/30 transition-colors group">
                          {/* NAME */}
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                   {trainee.name.charAt(0)}
                                </div>
                                <div>
                                   <div className="font-bold text-foreground">{trainee.name}</div>
                                   <div className="text-xs text-muted-foreground font-mono">{trainee.indos || 'No INDoS'}</div>
                                </div>
                             </div>
                          </td>

                          {/* RANK */}
                          <td className="p-4 text-muted-foreground">
                             <span className="bg-muted px-2 py-1 rounded text-xs font-medium border border-border">
                               {trainee.rank.replace('_', ' ')}
                             </span>
                          </td>

                          {/* NATIONALITY */}
                          <td className="p-4 text-muted-foreground">{trainee.nationality}</td>

                          {/* STATUS/VESSEL */}
                          <td className="p-4">
                             {trainee.status === 'Onboard' ? (
                                <div className="flex items-center gap-2 text-teal-600">
                                   <Ship size={14} />
                                   <span className="font-medium">{trainee.vessel}</span>
                                </div>
                             ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600">
                                   {trainee.status}
                                </span>
                             )}
                          </td>

                          {/* CONTACT */}
                          <td className="p-4 text-muted-foreground text-xs space-y-1">
                             <div className="flex items-center gap-2">
                                <Mail size={12} /> {trainee.email}
                             </div>
                             <div className="flex items-center gap-2">
                                <Phone size={12} /> {trainee.mobile}
                             </div>
                          </td>

                          {/* ACTIONS */}
                          <td className="p-4 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEdit(trainee)}
                                  className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                                >
                                   <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(trainee.id)}
                                  className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-600 transition-colors"
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
      
      {/* Updated to pass initialData */}
      <AddCadetModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAdd}
        initialData={editingCadet}
      />
    </div>
  );
};

export default CadetsPage;