import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, FileCheck, Download, Search, 
  Eye, Shield, AlertTriangle, X, CheckCircle, 
  Calendar, User, Ship, BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';

// --- TYPES ---
interface LockedRecord {
  id: string;
  cadetName: string;
  rank: string;
  indosNumber: string;
  vessel: string;
  lockedDate: string;
  lockedBy: string;
  reason: 'COMPLETED' | 'SIGN_OFF' | 'PROMOTION';
  certificateId?: string;
  status: 'LOCKED' | 'ARCHIVED' | 'CERTIFIED';
}

// --- MOCK DATA GENERATOR ---
// In a real app, this would fetch from an 'archived_trbs' table
const MOCK_LOCKED_RECORDS: LockedRecord[] = [
  {
    id: 'TRB-2025-001',
    cadetName: 'Amit Sharma',
    rank: 'Deck Cadet',
    indosNumber: '19ZL8812',
    vessel: 'MT Ocean Pride',
    lockedDate: '2025-12-10T14:30:00Z',
    lockedBy: 'Capt. Rajesh Kumar',
    reason: 'COMPLETED',
    certificateId: 'CERT-IN-2025-881',
    status: 'CERTIFIED'
  },
  {
    id: 'TRB-2025-002',
    cadetName: 'John Smith',
    rank: 'Engine Cadet',
    indosNumber: 'UK-882190',
    vessel: 'MV Northern Light',
    lockedDate: '2025-11-05T09:15:00Z',
    lockedBy: 'Ch. Eng. Sarah O\'Connor',
    reason: 'SIGN_OFF',
    status: 'LOCKED'
  },
  {
    id: 'TRB-2025-003',
    cadetName: 'Rahul Verma',
    rank: 'Deck Cadet',
    indosNumber: '20GM1102',
    vessel: 'MV Eastern Star',
    lockedDate: '2025-10-20T11:00:00Z',
    lockedBy: 'Capt. Ian McCloud',
    reason: 'PROMOTION',
    certificateId: 'CERT-IN-2025-902',
    status: 'ARCHIVED'
  },
  {
    id: 'TRB-2025-004',
    cadetName: 'Sofia Rossi',
    rank: 'Deck Cadet',
    indosNumber: 'IT-991231',
    vessel: 'MT Blue Horizon',
    lockedDate: '2026-01-02T16:45:00Z',
    lockedBy: 'Capt. Mario Russo',
    reason: 'COMPLETED',
    certificateId: 'CERT-IT-2026-004',
    status: 'CERTIFIED'
  }
];

const LockedTRBPage: React.FC = () => {
  const [records, setRecords] = useState<LockedRecord[]>(MOCK_LOCKED_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LockedRecord | null>(null);
  const [unlockReason, setUnlockReason] = useState('');

  // --- ACTIONS ---
  const handleDownload = (record: LockedRecord) => {
    toast.success(`Downloading Certificate ${record.certificateId || 'Record'}...`);
  };

  const initiateUnlock = (record: LockedRecord) => {
    setSelectedRecord(record);
    setUnlockModalOpen(true);
    setUnlockReason('');
  };

  const confirmUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim()) {
      toast.error("A valid reason is required for auditing purposes.");
      return;
    }
    
    toast.success(`TRB for ${selectedRecord?.cadetName} unlocked. Action logged.`);
    setUnlockModalOpen(false);
    
    // Simulating removal from locked list
    setRecords(prev => prev.filter(r => r.id !== selectedRecord?.id));
    setSelectedRecord(null);
  };

  // --- FILTER ---
  const filteredRecords = records.filter(r => 
    r.cadetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.certificateId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="text-primary" size={24} /> 
            Locked Records Vault
          </h1>
          <p className="text-muted-foreground text-sm">
            Access finalized TRBs, view completion certificates, and manage archival records.
          </p>
        </div>
        <div className="flex gap-3">
           <div className="bg-primary/5 text-primary border border-primary/20 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
              <BadgeCheck size={16} />
              {records.filter(r => r.status === 'CERTIFIED').length} Certificates Issued
           </div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm shrink-0">
         <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search by Name, Vessel, or Certificate ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 h-9 w-full"
            />
         </div>
      </div>

      {/* RECORDS TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border sticky top-0 z-10">
                 <tr>
                    <th className="p-4 w-1/4">Cadet / Identity</th>
                    <th className="p-4 w-1/5">Last Vessel</th>
                    <th className="p-4 w-1/5">Locked Details</th>
                    <th className="p-4 w-1/6 text-center">Status</th>
                    <th className="p-4 w-1/6 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {filteredRecords.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="p-10 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                             <Lock size={32} className="opacity-20" />
                             <span>No locked records found matching your search.</span>
                          </div>
                       </td>
                    </tr>
                 ) : (
                    filteredRecords.map((record) => (
                       <tr key={record.id} className="hover:bg-muted/30 transition-colors group">
                          
                          {/* CADET IDENTITY */}
                          <td className="p-4">
                             <div className="font-bold text-foreground flex items-center gap-2">
                                {record.cadetName}
                                {record.certificateId && <BadgeCheck size={14} className="text-blue-500" />}
                             </div>
                             <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                                <span>{record.rank}</span>
                                <span className="font-mono opacity-80">ID: {record.indosNumber}</span>
                             </div>
                          </td>

                          {/* VESSEL */}
                          <td className="p-4">
                             <div className="flex items-center gap-2 text-foreground font-medium">
                                <Ship size={14} className="text-muted-foreground" />
                                {record.vessel}
                             </div>
                          </td>

                          {/* LOCK META */}
                          <td className="p-4 text-xs">
                             <div className="space-y-1">
                                <div className="flex items-center gap-2 text-foreground">
                                   <Calendar size={12} className="text-muted-foreground" />
                                   {new Date(record.lockedDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground" title={record.lockedBy}>
                                   <User size={12} />
                                   <span className="truncate max-w-37.5">{record.lockedBy}</span>
                                </div>
                             </div>
                          </td>

                          {/* STATUS */}
                          <td className="p-4 text-center">
                             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                record.status === 'CERTIFIED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                record.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                             }`}>
                                {record.status === 'CERTIFIED' && <FileCheck size={12} />}
                                {record.status === 'LOCKED' && <Lock size={12} />}
                                {record.status}
                             </span>
                             {record.reason && (
                                <div className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">
                                   {record.reason.replace('_', ' ')}
                                </div>
                             )}
                          </td>

                          {/* ACTIONS */}
                          <td className="p-4 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  title="View Record"
                                  className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                >
                                   <Eye size={16} />
                                </button>
                                <button 
                                  title="Download Certificate"
                                  onClick={() => handleDownload(record)}
                                  className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-blue-600 transition-colors"
                                >
                                   <Download size={16} />
                                </button>
                                <button 
                                  title="Unlock / Re-open"
                                  onClick={() => initiateUnlock(record)}
                                  className="p-2 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600 transition-colors"
                                >
                                   <Unlock size={16} />
                                </button>
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* UNLOCK MODAL */}
      {unlockModalOpen && selectedRecord && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-xl border border-red-200 dark:border-red-900 shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-200">
               
               {/* Warning Header */}
               <div className="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center text-center border-b border-red-100 dark:border-red-900/50">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-3 text-red-600 dark:text-red-400">
                     <Unlock size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-red-900 dark:text-red-200">Unlock Training Record?</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                     This action will re-open the TRB for editing. The current verification status will be revoked.
                  </p>
               </div>

               <form onSubmit={confirmUnlock} className="p-6 space-y-4 bg-card">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-muted-foreground uppercase">Target Record</label>
                     <div className="p-3 bg-muted rounded-md text-sm font-medium flex justify-between">
                        <span>{selectedRecord.cadetName}</span>
                        <span className="font-mono opacity-70">{selectedRecord.id}</span>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-muted-foreground uppercase">Reason for Unlocking <span className="text-red-500">*</span></label>
                     <textarea 
                        required
                        value={unlockReason}
                        onChange={(e) => setUnlockReason(e.target.value)}
                        className="w-full h-24 p-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
                        placeholder="e.g. Correction of sea service dates required..."
                     />
                     <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <AlertTriangle size={10} />
                        This action will be logged in the System Audit Trail.
                     </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button 
                        type="button" 
                        onClick={() => setUnlockModalOpen(false)}
                        className="flex-1 py-2.5 rounded-lg border border-input hover:bg-muted text-sm font-medium transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit" 
                        className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md transition-colors"
                     >
                        Confirm Unlock
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

export default LockedTRBPage;