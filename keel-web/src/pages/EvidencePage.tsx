import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, FileText, Search, Filter, 
  Download, Eye, Grid, List, Ship, User, Calendar,
  MoreVertical, CheckCircle, Clock,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { getCadets, getAllProgress, getSyllabus } from '../services/dataService';
import { toast } from 'sonner';

// --- TYPES ---
interface EvidenceItem {
  id: string;
  type: 'IMAGE' | 'DOCUMENT';
  url: string; 
  fileName: string;
  fileSize: string;
  uploadDate: string;
  
  // Context
  cadetId: string;
  cadetName: string;
  vessel: string;
  
  // Task Context
  taskId: string;
  taskRef: string;
  taskTitle: string;
  
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

// --- MOCK DATA GENERATOR ---
const generateMockEvidence = (): EvidenceItem[] => {
  const images = [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop', // Engine
    'https://images.unsplash.com/photo-1559599076-9c61d8e1b425?q=80&w=800&auto=format&fit=crop', // Deck
    'https://images.unsplash.com/photo-1628133287823-34e819b13c32?q=80&w=800&auto=format&fit=crop', // Bridge
    'https://images.unsplash.com/photo-1517420879524-86d64ac2f339?q=80&w=800&auto=format&fit=crop', // Safety
  ];
  
  return Array.from({ length: 24 }).map((_, i) => ({
    id: `EV-${Date.now()}-${i}`,
    type: i % 4 === 0 ? 'DOCUMENT' : 'IMAGE',
    url: images[i % images.length],
    fileName: i % 4 === 0 ? `maintenance_report_${i}.pdf` : `task_evidence_${i}.jpg`,
    fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
    uploadDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    
    cadetId: `C-${i}`,
    cadetName: ['John Doe', 'Sarah Smith', 'Rahul Verma', 'Mike Ross'][i % 4],
    vessel: ['MT Ocean Pride', 'MV Northern Light', 'MV Eastern Star'][i % 3],
    
    taskId: `T-${i}`,
    taskRef: ['A1.1', 'B2.3', 'C4.1', 'D1.2'][i % 4],
    taskTitle: [
      'Overhaul of Main Engine Injectors',
      'Celestial Navigation Calculation',
      'Lifeboat Drill Participation',
      'Safety Officer Assistance'
    ][i % 4],
    
    status: Math.random() > 0.3 ? 'VERIFIED' : 'PENDING'
  }));
};

const EvidencePage: React.FC = () => {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'DOCUMENT'>('ALL');
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Viewer State
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  useEffect(() => {
    loadEvidence();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const loadEvidence = () => {
    const allProgress = getAllProgress();
    const cadets = getCadets();
    const syllabus = getSyllabus();
    
    const realItems: EvidenceItem[] = [];

    Object.keys(allProgress).forEach(cadetId => {
      const cadet = cadets.find((c: any) => String(c.id) === cadetId);
      if (!cadet) return;

      Object.keys(allProgress[cadetId]).forEach(taskId => {
        const taskEntry = allProgress[cadetId][taskId];
        if (taskEntry.evidence) {
           let taskTitle = 'Unknown Task';
           let taskRef = 'TASK';
           
           syllabus.forEach((func: any) => {
             func.topics.forEach((topic: any) => {
               const t = topic.tasks.find((k: any) => k.id === taskId);
               if (t) {
                 taskTitle = t.title;
                 taskRef = t.id.split('-')[1] || 'TASK';
               }
             });
           });

           realItems.push({
             id: `REAL-${cadetId}-${taskId}`,
             type: taskEntry.evidence.startsWith('data:image') ? 'IMAGE' : 'DOCUMENT',
             url: taskEntry.evidence,
             fileName: `upload_${taskId.substring(0,8)}`,
             fileSize: 'Unknown',
             uploadDate: taskEntry.timestamp,
             cadetId: String(cadet.id),
             cadetName: cadet.name,
             vessel: cadet.vessel || 'Unassigned',
             taskId,
             taskRef,
             taskTitle,
             status: taskEntry.status === 'COMPLETED' ? 'VERIFIED' : 'PENDING'
           });
        }
      });
    });

    if (realItems.length > 0) {
      setItems(realItems.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
    } else {
      setItems(generateMockEvidence());
    }
  };

  const handleDownload = (item: EvidenceItem) => {
    toast.success(`Downloading ${item.fileName}...`);
  };

  // --- FILTERING & PAGINATION ---
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.cadetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.taskTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'ALL' || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evidence Repository</h1>
          <p className="text-muted-foreground text-sm">
            Centralized library of all trainee uploaded photos, documents, and reports.
          </p>
        </div>
        
        <div className="bg-muted/50 p-1 rounded-lg border border-border flex">
           <button 
             onClick={() => setViewMode('GRID')}
             className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <Grid size={18} />
           </button>
           <button 
             onClick={() => setViewMode('LIST')}
             className={`p-2 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <List size={18} />
           </button>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search by Cadet, Vessel, or Task..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-9 h-9 w-full"
           />
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-muted/30 rounded-lg p-1 border border-border">
              <button 
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterType === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                ALL
              </button>
              <button 
                onClick={() => setFilterType('IMAGE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterType === 'IMAGE' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                PHOTOS
              </button>
              <button 
                onClick={() => setFilterType('DOCUMENT')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterType === 'DOCUMENT' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                DOCS
              </button>
           </div>
        </div>
      </div>

      {/* CONTENT AREA (WITH PAGINATION FOOTER) */}
      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* SCROLLABLE LIST/GRID */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Filter size={48} className="opacity-20 mb-4" />
                <p>No evidence found matching your filters.</p>
             </div>
          ) : (
             viewMode === 'GRID' ? (
               /* GRID VIEW */
               <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedItems.map(item => (
                     <div 
                       key={item.id} 
                       className="group relative bg-background border border-border rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col"
                       onClick={() => setSelectedItem(item)}
                     >
                        <div className="aspect-video bg-muted/30 relative overflow-hidden flex items-center justify-center">
                           {item.type === 'IMAGE' ? (
                              <img src={item.url} alt={item.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           ) : (
                              <FileText size={48} className="text-muted-foreground/50" />
                           )}
                           
                           <div className="absolute top-2 right-2">
                              {item.status === 'VERIFIED' && (
                                 <div className="bg-green-500/90 text-white p-1 rounded-full shadow-sm" title="Verified">
                                    <CheckCircle size={12} />
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="p-3 flex-1 flex flex-col">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <p className="text-xs font-bold text-foreground line-clamp-1" title={item.taskTitle}>{item.taskTitle}</p>
                                 <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.taskRef}</p>
                              </div>
                           </div>
                           
                           <div className="mt-auto space-y-1.5 pt-2 border-t border-border/50">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                 <User size={10} /> <span className="truncate">{item.cadetName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                 <Ship size={10} /> <span className="truncate">{item.vessel}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                 <Calendar size={10} /> <span>{new Date(item.uploadDate).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
             ) : (
               /* LIST VIEW */
               <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border sticky top-0 z-10">
                     <tr>
                        <th className="p-4 w-12"></th>
                        <th className="p-4 w-1/4">File Name</th>
                        <th className="p-4 w-1/4">Task Context</th>
                        <th className="p-4 w-1/5">Cadet / Vessel</th>
                        <th className="p-4 w-1/6">Date</th>
                        <th className="p-4 w-12"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {paginatedItems.map(item => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setSelectedItem(item)}>
                           <td className="p-4 text-center">
                              {item.type === 'IMAGE' ? <ImageIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-orange-500" />}
                           </td>
                           <td className="p-4 font-medium text-foreground">
                              {item.fileName}
                              {item.status === 'VERIFIED' && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700">Verified</span>}
                           </td>
                           <td className="p-4">
                              <div className="text-xs font-bold">{item.taskRef}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-50">{item.taskTitle}</div>
                           </td>
                           <td className="p-4 text-xs">
                              <div className="font-bold">{item.cadetName}</div>
                              <div className="text-muted-foreground">{item.vessel}</div>
                           </td>
                           <td className="p-4 text-xs text-muted-foreground">
                              {new Date(item.uploadDate).toLocaleDateString()}
                           </td>
                           <td className="p-4 text-right">
                              <button className="p-2 hover:bg-muted rounded-full" onClick={(e) => { e.stopPropagation(); handleDownload(item); }}>
                                 <Download size={16} className="text-muted-foreground" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             )
          )}
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              <span className="ml-2">
                 Showing {Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredItems.length, currentPage * itemsPerPage)} of {filteredItems.length}
              </span>
           </div>
           
           <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1} 
                className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"
                title="First Page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1} 
                className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-sm font-medium px-4">Page {currentPage} of {totalPages || 1}</span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors"
                title="Last Page"
              >
                <ChevronsRight size={16} />
              </button>
           </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedItem && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
               
               {/* Toolbar */}
               <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
                  <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg pointer-events-auto">
                     <h3 className="font-bold text-sm">{selectedItem.fileName}</h3>
                     <p className="text-xs opacity-70">{selectedItem.cadetName} • {selectedItem.vessel}</p>
                  </div>
                  <div className="flex gap-2 pointer-events-auto">
                     <button 
                       onClick={() => handleDownload(selectedItem)}
                       className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                     >
                        <Download size={20} />
                     </button>
                     <button 
                       onClick={() => setSelectedItem(null)}
                       className="p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors"
                     >
                        <Search size={20} className="rotate-45" />
                     </button>
                  </div>
               </div>

               {/* Content */}
               <div className="flex-1 flex items-center justify-center overflow-hidden">
                  {selectedItem.type === 'IMAGE' ? (
                     <img 
                       src={selectedItem.url} 
                       alt="Evidence Full" 
                       className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                     />
                  ) : (
                     <div className="bg-white p-10 rounded-xl flex flex-col items-center text-center">
                        <FileText size={64} className="text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Document Preview</h3>
                        <p className="text-gray-500 mb-6 max-w-xs">
                           This document format cannot be previewed directly. Please download to view.
                        </p>
                        <button 
                           onClick={() => handleDownload(selectedItem)}
                           className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-primary/90"
                        >
                           Download Document
                        </button>
                     </div>
                  )}
               </div>

               {/* Footer Details */}
               <div className="mt-4 bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl text-sm flex justify-between items-center text-foreground">
                  <div>
                     <span className="font-bold text-primary mr-2">{selectedItem.taskRef}</span>
                     {selectedItem.taskTitle}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                     <span className="flex items-center gap-1"><Clock size={12}/> Uploaded: {new Date(selectedItem.uploadDate).toLocaleString()}</span>
                     {selectedItem.status === 'VERIFIED' && <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Verified</span>}
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default EvidencePage;