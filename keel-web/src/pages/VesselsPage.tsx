import React, { useEffect, useState } from 'react';
import { 
  Ship, Plus, Search, Upload, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUpDown, Users 
} from 'lucide-react';
import { getCadets } from '../services/dataService'; // We still keep cadets from local/mock for now
import { vesselService } from '../services/vesselService'; // <--- NEW SERVICE
import ImportVesselModal from '../components/vessels/ImportVesselModal';
import AddVesselModal from '../components/vessels/AddVesselModal';
import { toast } from 'sonner';

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const VesselsPage: React.FC = () => {
  const [vessels, setVessels] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  // --- 1. LOAD DATA FROM API ---
  const refreshData = async () => {
    try {
      // FIX: Use vesselService instead of getVessels()
    
      const fleet = await vesselService.getAll();
      setVessels(Array.isArray(fleet) ? fleet : []);

      console.log("fleet",fleet)

      const crew = getCadets(); // Still local for now
      setTrainees(Array.isArray(crew) ? crew : []);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Could not connect to fleet database.");
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getCadetCount = (vesselName: string) => {
    return trainees.filter((t: any) => t.vessel === vesselName && t.status === 'Onboard').length;
  };

  // --- 2. HANDLE SAVE (CREATE / UPDATE) ---
  const handleSaveVessel = async (data: any) => {
    try {
      if (data.id) {
        // Edit Mode
        const payload={
          id:data.id,
          name:data.name,
          imo_number:data.imo_number,
          vessel_type: data.vessel_type,
          flag:data.flag,
          classSociety: data.classSociety,
          is_active:data.is_active
        }
        await vesselService.update(data.id, payload);
        toast.success('Vessel details updated.');
      } else {
        // Add Mode
        await vesselService.create(data);
        toast.success('New vessel added to fleet.');
      }
      refreshData(); // Reload from DB
      setIsAddOpen(false);
      setEditingVessel(null);
    } catch (error) {
      console.error(error);
      toast.error("Operation failed. Check server connection.");
    }
  };

  const handleEditClick = (vessel: any) => {
    setEditingVessel(vessel);
    setIsAddOpen(true);
  };

  // --- 3. HANDLE DELETE ---
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this vessel?')) {
      try {
        await vesselService.delete(id);
        toast.success('Vessel removed.');
        refreshData();
      } catch (error) {
        toast.error("Could not delete vessel.");
      }
    }
  };

  // --- 4. IMPORT HANDLER (Bulk Create) ---
const handleImport = async (data: any[]) => {
  let successCount = 0;
  let failCount = 0;

  for (const item of data) {
    try {
      console.log(item)
      // Map your Excel/CSV headers to what the Backend needs
      const vesselPayload = {
        name: item.Name || item.name,
        imo_number: item.imo,
        vessel_type: item.type || item.vesselType || item.vessel_type || "Other",
        flag: item.Flag || item.flag || "Unknown",
        };

      await vesselService.create(vesselPayload);
      successCount++;
    } catch (err) {
      console.error("Row failed:", item, err);
      failCount++;
    }
  }

  if (failCount === 0) {
    toast.success(`Successfully imported ${successCount} vessels.`);
  } else {
    toast.error(`Import finished: ${successCount} success, ${failCount} failed.`);
  }
  refreshData();
};

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processData = () => {
    let filtered = vessels.filter((v: any) => 
      (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.imo || v.imoNumber || '').includes(searchQuery)
    );

    filtered.sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'cadets') {
        valA = getCadetCount(a.name);
        valB = getCadetCount(b.name);
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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground text-sm">Monitor active vessels and cadet allocation.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Upload size={18} /><span>Import Fleet</span>
           </button>
           <button 
             onClick={() => { setEditingVessel(null); setIsAddOpen(true); }}
             className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
           >
             <Plus size={18} /><span>Add Vessel</span>
           </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shrink-0 shadow-sm">
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search Fleet..." 
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

      {/* TABLE CONTAINER */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                 <tr className="border-b border-border">
                    {[
                      { label: 'Vessel Name / Flag', key: 'name', width: 'w-1/4' },
                      { label: 'IMO Number', key: 'imo', width: 'w-1/6' },
                      { label: 'Type', key: 'type', width: 'w-1/6' },
                      { label: 'Class', key: 'classSociety', width: 'w-1/6' },
                      { label: 'Status', key: 'status', width: 'w-1/12' },
                      { label: 'Cadets', key: 'cadets', width: 'w-1/12' },
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
                       <td colSpan={7} className="p-10 text-center text-muted-foreground">
                          {vessels.length === 0 ? "Loading fleet data..." : "No vessels found matching your criteria."}
                       </td>
                    </tr>
                 ) : (
                    paginatedData.map((vessel: any) => {
                       const cadetCount = getCadetCount(vessel.name);
                       return (
                          <tr key={vessel.id} className="hover:bg-muted/30 transition-colors group">
                             <td className="p-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                                      <Ship size={16} />
                                   </div>
                                   <div>
                                      <div className="font-bold text-foreground">{vessel.name}</div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                         <span role="img" aria-label="flag">🏳️</span> {vessel.flag}
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4 font-mono text-muted-foreground">{vessel.imo || vessel.imo_number}</td>
                             <td className="p-4 text-foreground">{vessel.ship_type_id}</td>
                             <td className="p-4 text-muted-foreground truncate max-w-37.5" title={vessel.classSociety}>
                                {vessel.class_society}
                             </td>

                             <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                   vessel.is_active 
                                   ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                                   : 'bg-gray-500/10 text-gray-600'
                                }`}>
                                   {vessel.is_active?"Active":"Inactive"}
                                </span>
                             </td>
                             <td className="p-4">
                                <div className={`flex items-center gap-1 font-medium ${cadetCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                   <Users size={14} />
                                   {cadetCount}
                                </div>
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                     onClick={() => handleEditClick(vessel)}
                                     className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                                   >
                                      <Edit size={16} />
                                   </button>
                                   <button 
                                      onClick={() => handleDelete(vessel.id)}
                                      className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-600 transition-colors"
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

      <ImportVesselModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport} 
      />

      <AddVesselModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveVessel}
        editData={editingVessel}
      />
    </div>
  );
};

export default VesselsPage;