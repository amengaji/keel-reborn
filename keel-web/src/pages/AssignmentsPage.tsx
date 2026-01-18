// keel-web/src/pages/AssignmentsPage.tsx

import React, { useEffect, useState } from 'react';
import { Ship, ArrowRight, UserCheck, Hand, Search, UserMinus } from 'lucide-react'; 
import { cadetAssignmentService } from '../services/cadetAssignmentService'; 
import { cadetService } from '../services/cadetService'; 
import { vesselService } from '../services/vesselService';
import { toast } from 'sonner';

/**
 * AssignmentsPage Component
 * Manages vessel crew assignments with drag-and-drop.
 * FIXED: Replaced hardcoded slate colors with semantic theme variables (bg-background, bg-card, etc.)
 * This ensures perfect compatibility with the light/dark mode CSS variables defined in index.css.
 */
const AssignmentsPage: React.FC = () => {
  const [cadets, setCadets] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // MODAL & UI STATE
  const [selectedCadet, setSelectedCadet] = useState<any>(null);
  const [assignDate, setAssignDate] = useState('');
  const [selectedVesselId, setSelectedVesselId] = useState('');

  // DRAG STATE
  const [dragOverVesselId, setDragOverVesselId] = useState<number | null>(null);

  // SEARCH FILTERS
  const [searchReady, setSearchReady] = useState('');
  const [searchFleet, setSearchFleet] = useState('');

  /**
   * Helper function to safely get display names from first/last name.
   * Ensures UI consistency regardless of backend data state.
   */
  const getTraineeName = (c: any) => {
    if (!c) return "Unknown Trainee";
    const firstName = c.first_name || '';
    const lastName = c.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName.length > 0 ? fullName : (c.rank || "Unnamed Trainee");
  };

  /**
   * Refreshes all data from the database concurrently.
   * Fetches Cadets, Vessels, and Assignments in one pass.
   */
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [cadetRes, vesselRes, assignmentRes] = await Promise.all([
        cadetService.getAll(),
        vesselService.getAll(),
        cadetAssignmentService.getActive()
      ]);

      setCadets(Array.isArray(cadetRes) ? cadetRes : []);
      setVessels(Array.isArray(vesselRes) ? vesselRes : []);
      setAssignments(Array.isArray(assignmentRes) ? assignmentRes : []);
    } catch (error) {
      console.error("FETCH ERROR:", error);
      toast.error("Failed to connect to fleet database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  /**
   * Sends assignment data to backend.
   * Uses the updated trainee_id field for SQL compatibility.
   */
  const handleAssign = async () => {
    if (!selectedCadet || !selectedVesselId || !assignDate) {
      toast.error("Please fill all assignment details.");
      return;
    }

    try {
      await cadetAssignmentService.assign({
        trainee_id: selectedCadet.id,
        vessel_id: Number(selectedVesselId),
        sign_on_date: assignDate
      });

      toast.success(`${getTraineeName(selectedCadet)} assigned successfully.`);
      setSelectedCadet(null);
      setSelectedVesselId('');
      setAssignDate('');
      refreshData();
    } catch (err: any) {
      toast.error(err.message || "Assignment failed.");
    }
  };

  /**
   * Confirms and executes trainee sign-off (unassignment).
   */
  const handleUnassign = async (trainee: any) => {
    if (!window.confirm(`Are you sure you want to sign off ${getTraineeName(trainee)}?`)) {
      return;
    }

    try {
      await cadetAssignmentService.unassign(trainee.id);
      toast.info(`${getTraineeName(trainee)} has been signed off.`);
      refreshData();
    } catch (err) {
      toast.error("Could not process unassignment.");
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  
  const handleDragStart = (e: React.DragEvent, cadet: any) => {
    e.dataTransfer.setData("cadet", JSON.stringify(cadet));
  };
  
  const handleDragOver = (e: React.DragEvent, vesselId: number) => {
    e.preventDefault();
    setDragOverVesselId(vesselId);
  };
  
  const handleDrop = (e: React.DragEvent, vessel: any) => {
    e.preventDefault();
    setDragOverVesselId(null);
    const cadetData = e.dataTransfer.getData("cadet");
    if (!cadetData) return;

    const cadet = JSON.parse(cadetData);
    setSelectedCadet(cadet);
    setSelectedVesselId(vessel.id.toString());
  };

  // --- FILTERING LOGIC ---

  const readyCadets = cadets.filter(c => 
    (c.status === 'Ready' || c.status === 'Leave' || c.status === 'Training') &&
    getTraineeName(c).toLowerCase().includes(searchReady.toLowerCase())
  );

  const filteredVessels = vessels.filter(v =>
    (v.name || '').toLowerCase().includes(searchFleet.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col bg-background p-4 transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trainee Assignments</h1>
        <p className="text-muted-foreground text-sm italic">Drag 'Ready' trainees to vessels to assign them.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: READY POOL - Logic remains exactly as before */}
        <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm transition-colors duration-300">
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UserCheck size={18} className="text-primary" /> Ready Pool
              </h3>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
                {readyCadets.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search trainees..."
                value={searchReady}
                onChange={(e) => setSearchReady(e.target.value)}
                className="input-field pl-8"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {readyCadets.map(cadet => (
              <div
                key={cadet.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cadet)}
                className="bg-background border border-border p-3 rounded-lg flex justify-between items-center hover:border-primary hover:shadow-md cursor-grab active:cursor-grabbing transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <Hand size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{getTraineeName(cadet)}</p>
                    <p className="text-xs text-muted-foreground font-semibold">{cadet.rank}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCadet(cadet)}
                  className="bg-muted text-muted-foreground p-1.5 rounded-md border border-border opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: FLEET STATUS - Replaced slate with semantic bg-card/bg-background */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm transition-colors duration-300">
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Ship size={18} className="text-primary" /> Fleet Status
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search vessels..."
                value={searchFleet}
                onChange={(e) => setSearchFleet(e.target.value)}
                className="input-field pl-8"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVessels.map(vessel => {
              // Filters assignment state to identify active trainees onboard
              const crew = assignments
                .filter(a => String(a.vessel_id) === String(vessel.id) && a.status === 'ACTIVE')
                .map(a => a.trainee)
                .filter(Boolean);

              const isDragOver = dragOverVesselId === vessel.id;
              const label = crew.length === 1 ? '1 Trainee' : `${crew.length} Trainees`;

              return (
                <div
                  key={vessel.id}
                  onDragOver={(e) => handleDragOver(e, vessel.id)}
                  onDragLeave={() => setDragOverVesselId(null)}
                  onDrop={(e) => handleDrop(e, vessel)}
                  className={`border rounded-xl p-4 flex flex-col transition-all duration-300 min-h-[140px] shadow-sm ${
                    isDragOver 
                      ? 'border-dashed border-2 border-primary bg-primary/5 scale-[1.01]' 
                      : 'bg-background border-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <h4 className={`font-bold transition-colors ${isDragOver ? 'text-primary' : 'text-foreground'}`}>{vessel.name}</h4>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">{vessel.vessel_type}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-muted px-2.5 py-1 rounded border border-border text-muted-foreground uppercase">
                      {label}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col space-y-2">
                    {crew.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                        <p className="text-xs text-muted-foreground italic font-medium">No trainees onboard.</p>
                      </div>
                    ) : (
                      crew.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between bg-card p-2.5 rounded-lg border border-border shadow-xs group hover:border-primary transition-all">
                          <div className="flex items-center gap-3 overflow-hidden truncate">
                             <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                               {c.first_name?.charAt(0)}{c.last_name?.charAt(0)}
                             </div>
                             <div className="truncate flex flex-col gap-0">
                               <p className="text-sm font-bold truncate text-foreground">{getTraineeName(c)}</p>
                               {/* RANK DISPLAY: Remains visible underneath the name as per rules */}
                               <p className="text-[9px] text-muted-foreground uppercase font-extrabold tracking-tight">{c.rank || 'N/A'}</p>
                             </div>
                          </div>
                          <button
                            onClick={() => handleUnassign(c)}
                            className="text-muted-foreground hover:text-destructive p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
                          >
                            <UserMinus size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ASSIGNMENT MODAL - Theming fixed using bg-card and border-border */}
      {selectedCadet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border space-y-5 animate-in zoom-in-95 duration-200">
             <div className="border-b border-border pb-3">
               <h3 className="font-bold text-lg text-foreground">Assign {getTraineeName(selectedCadet)}</h3>
               <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-widest">{selectedCadet.rank}</p>
             </div>
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Vessel</label>
                   <select
                     className="input-field cursor-pointer"
                     value={selectedVesselId}
                     onChange={(e) => setSelectedVesselId(e.target.value)}
                   >
                     <option value="">-- Choose Vessel --</option>
                     {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sign On Date</label>
                   <input
                     type="date"
                     className="input-field"
                     value={assignDate}
                     onChange={(e) => setAssignDate(e.target.value)}
                   />
                </div>
             </div>
             <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => { setSelectedCadet(null); setSelectedVesselId(''); }} 
                  className="px-4 py-2 text-sm text-muted-foreground font-semibold hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAssign} 
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Confirm Assignment
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;