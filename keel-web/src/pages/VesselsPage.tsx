// amengaji/keel-reborn/keel-reborn-8e3419f76262b0acdc74d700afab81401a9542d0/keel-web/src/pages/VesselsPage.tsx

import React, { useEffect, useState } from 'react';
import { 
  Ship, Plus, Search, Upload, Edit, Trash2, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUpDown, Users 
} from 'lucide-react';
import { getCadets } from '../services/dataService'; 
import { vesselService } from '../services/vesselService'; 
import ImportVesselModal from '../components/vessels/ImportVesselModal';
import AddVesselModal from '../components/vessels/AddVesselModal';
import { toast } from 'sonner';

/**
 * VesselsPage Component
 * Manages the display, search, sorting, and CRUD operations for the Fleet.
 */
const VesselsPage: React.FC = () => {
  // State for storing the list of vessels and trainees
  const [vessels, setVessels] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  
  // UI State for modals and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<any>(null); // Stores the vessel being edited
  
  // Pagination and Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  /**
   * Fetches fresh data from the backend API.
   * Ensures that the UI stays in sync with the database.
   */
  const refreshData = async () => {
    try {
      const fleet = await vesselService.getAll();
      // Ensure we always work with an array to prevent .map() errors
      setVessels(Array.isArray(fleet) ? fleet : []);

      const crew = getCadets(); 
      setTrainees(Array.isArray(crew) ? crew : []);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Could not connect to fleet database.");
    }
  };

  // Load data on initial component mount
  useEffect(() => {
    refreshData();
  }, []);

  /**
   * Calculates how many cadets are currently assigned to a specific vessel.
   */
  const getCadetCount = (vesselName: string) => {
    return trainees.filter((t: any) => t.vessel === vesselName && t.status === 'Onboard').length;
  };

  /**
   * Handles both Creating and Updating a vessel.
   * If an 'id' exists, it triggers an update; otherwise, it creates a new entry.
   */
  const handleSaveVessel = async (data: any) => {
    try {
      // Map the form data to the backend schema fields
      const vesselPayload = {
        name: data.name,
        imo_number: data.imo || data.imo_number, // Ensure IMO number is captured correctly
        vessel_type: data.type || data.vessel_type,
        flag: data.flag,
        class_society: data.class_society,
        is_active: data.is_active === undefined ? true : data.is_active
      };

      if (editingVessel && editingVessel.id) {
        // Edit Mode: Send PUT request to update existing record
        await vesselService.update(editingVessel.id, vesselPayload);
        toast.success('Vessel details updated successfully.');
      } else {
        // Add Mode: Send POST request to create new record
        await vesselService.create(vesselPayload);
        toast.success('New vessel added to fleet.');
      }
      
      refreshData(); // Fetch the updated list from the server
      setIsAddOpen(false);
      setEditingVessel(null); // Clear the edit state
    } catch (error) {
      console.error(error);
      toast.error("Operation failed. Please check server connection.");
    }
  };

  /**
   * Opens the AddVesselModal in 'Edit Mode' with pre-filled data.
   */
  const handleEditClick = (vessel: any) => {
    setEditingVessel(vessel);
    setIsAddOpen(true);
  };

  /**
   * Deletes a vessel record after user confirmation.
   */
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this vessel?')) {
      try {
        await vesselService.delete(id);
        toast.success('Vessel removed from database.');
        refreshData();
      } catch (error) {
        toast.error("Could not delete vessel.");
      }
    }
  };

  /**
   * Handles bulk import from Excel/CSV.
   * Iterates through the imported data and creates a record for each.
   */
  const handleImport = async (data: any[]) => {
    let successCount = 0;
    let failCount = 0;

    toast.info(`Starting import of ${data.length} vessels...`);

    for (const item of data) {
      try {
        const vesselPayload = {
          name: item.name,
          imo_number: String(item.imo),
          vessel_type: item.vessel_type || "Other",
          flag: item.flag || "Unknown",
          class_society: item.class_society || "Unknown",
          is_active: true
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

  /**
   * Logic for sorting columns.
   */
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /**
   * Filters and sorts the data based on search and sort state.
   */
  const processData = () => {
    let filtered = vessels.filter((v: any) => 
      (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.imo_number || v.imo || '').includes(searchQuery)
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
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col dark:bg-background">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground text-sm">Monitor active vessels and cadet allocation.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="bg-card dark:bg-muted/20 hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95"
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

      {/* SEARCH AND SETTINGS TOOLBAR */}
      <div className="flex justify-between items-center bg-card dark:bg-muted/10 p-4 rounded-xl border border-border shrink-0 shadow-sm">
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search Fleet (Name or IMO)..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-9 h-9 w-full bg-background border-border"
           />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span>Rows per page:</span>
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

      {/* MAIN DATA TABLE */}
      <div className="bg-card dark:bg-muted/5 border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/50 dark:bg-muted/20 sticky top-0 z-10">
                 <tr className="border-b border-border">
                    {[
                      { label: 'Vessel Name / Flag', key: 'name', width: 'w-1/4' },
                      { label: 'IMO Number', key: 'imo_number', width: 'w-1/6' },
                      { label: 'Type', key: 'vessel_type', width: 'w-1/6' },
                      { label: 'Class', key: 'class_society', width: 'w-1/6' },
                      { label: 'Status', key: 'is_active', width: 'w-1/12' },
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
                          {vessels.length === 0 ? "Loading fleet data..." : "No vessels found."}
                       </td>
                    </tr>
                 ) : (
                    paginatedData.map((vessel: any) => {
                       const cadetCount = getCadetCount(vessel.name);
                       return (
                          <tr key={vessel.id} className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors group">
                             <td className="p-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                                      <Ship size={16} />
                                   </div>
                                   <div>
                                      <div className="font-bold text-foreground">{vessel.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                         🏳️ {vessel.flag}
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4 font-mono text-muted-foreground">{vessel.imo_number || vessel.imo}</td>
                             <td className="p-4 text-foreground">{vessel.vessel_type}</td>
                             <td className="p-4 text-muted-foreground truncate max-w-37.5" title={vessel.class_society}>
                                {vessel.class_society}
                             </td>

                             <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                   vessel.is_active 
                                   ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                                   : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                                }`}>
                                   {vessel.is_active ? "Active" : "Inactive"}
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
                                     title="Edit Vessel"
                                   >
                                      <Edit size={16} />
                                   </button>
                                   <button 
                                      onClick={() => handleDelete(vessel.id)}
                                      className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-600 transition-colors"
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