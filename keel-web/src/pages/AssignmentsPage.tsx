// keel-web/src/pages/AssignmentsPage.tsx

import React, { useEffect, useState } from 'react';
import { Ship, ArrowRight, UserCheck, Hand, Search, UserMinus } from 'lucide-react'; 
import { cadetAssignmentService } from '../services/cadetAssignmentService'; 
import { cadetService } from '../services/cadetService'; 
import { vesselService } from '../services/vesselService';
import { toast } from 'sonner';

/**
 * AssignmentsPage Component
 * Connected to the SQL backend to manage real-time vessel assignments.
 */
const AssignmentsPage: React.FC = () => {
  const [cadets, setCadets] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // MODAL STATE
  const [selectedCadet, setSelectedCadet] = useState<any>(null);
  const [assignDate, setAssignDate] = useState('');
  const [selectedVessel, setSelectedVessel] = useState('');

  // DRAG STATE
  const [dragOverVesselId, setDragOverVesselId] = useState<string | number | null>(null);

  // SEARCH STATES
  const [searchReady, setSearchReady] = useState('');
  const [searchFleet, setSearchFleet] = useState('');

  /**
   * Fetches real data from the Backend API
   */
  const refreshData = async () => {
    setIsLoading(true);

    try {
      const cadetPromise = cadetService.getAll();
      const vesselPromise = vesselService.getAll();
      const assignmentPromise = cadetAssignmentService.getActive();

      const [cadetRes, vesselRes, assignmentRes] = await Promise.all([
        cadetPromise,
        vesselPromise,
        assignmentPromise
      ]);

      const cadetData = Array.isArray(cadetRes?.data) ? cadetRes.data : cadetRes;
      const vesselData = Array.isArray(vesselRes?.data) ? vesselRes.data : vesselRes;
      const assignmentData = Array.isArray(assignmentRes?.data)
        ? assignmentRes.data
        : assignmentRes;

      setCadets(Array.isArray(cadetData) ? cadetData : []);
      setVessels(Array.isArray(vesselData) ? vesselData : []);
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
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
   * Handles assigning a cadet to a vessel in the DB
   */
  const handleAssign = async () => {
    if (!selectedCadet || !selectedVessel || !assignDate) {
      toast.error("Please fill all assignment details.");
      return;
    }

    try {
      await cadetAssignmentService.assign({
        cadet_id: selectedCadet.id,
        vessel_id: Number(selectedVessel),
        sign_on_date: assignDate
      });

      toast.success(
        `${selectedCadet.first_name} ${selectedCadet.last_name} assigned`
      );

      setSelectedCadet(null);
      setSelectedVessel('');
      setAssignDate('');
      refreshData();
    } catch (err) {
      console.error("ASSIGN UI ERROR:", err);
      toast.error("Assignment failed on server.");
    }
  };


  /**
   * HANDLE UNASSIGN
   */
  const handleUnassign = async (trainee: any) => {
    if (
      !window.confirm(
        `Are you sure you want to unassign ${trainee.first_name} ${trainee.last_name}?`
      )
    ) {
      return;
    }

    try {
      await cadetAssignmentService.unassign(trainee.id);
      toast.info(`${trainee.first_name} ${trainee.last_name} returned to Ready Pool.`);

      refreshData();
    } catch (err) {
      console.error("UNASSIGN UI ERROR:", err);
      toast.error("Could not process unassignment.");
    }
  };

  // DRAG HANDLERS
  const handleDragStart = (e: React.DragEvent, cadet: any) => {
    e.dataTransfer.setData("cadet", JSON.stringify(cadet));
  };
  
  const handleDragOver = (e: React.DragEvent, vesselId: string | number) => {
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
    setSelectedVessel(vessel.name);
  };

    /**
     * FILTER LOGIC
     */
    const readyCadets = cadets
    .filter(c => c.status === 'Ready' || c.status === 'Leave' || c.status === 'Training')
    .filter(c =>
      `${c.first_name ?? ''} ${c.last_name ?? ''}`
        .toLowerCase()
        .includes(searchReady.toLowerCase())
    );


  const filteredVessels = vessels.filter(v =>
    (v.name || '').toLowerCase().includes(searchFleet.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col dark:bg-background">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trainee Assignments</h1>
        <p className="text-muted-foreground text-sm">
          Drag 'Ready' trainees from the database to active vessels.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

        {/* LEFT COL: READY POOL */}
        <div className="bg-card dark:bg-muted/10 border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UserCheck size={18} className="text-blue-500" /> Ready Pool
              </h3>
              <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                {readyCadets.length}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search DB trainees..."
                value={searchReady}
                onChange={(e) => setSearchReady(e.target.value)}
                className="w-full bg-background dark:bg-background/50 pl-8 pr-3 py-1.5 rounded-md border border-input text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <p className="text-center text-xs text-muted-foreground py-10">
                Syncing with server...
              </p>
            ) : readyCadets.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-10">
                No ready trainees in database.
              </p>
            ) : (
              readyCadets.map(cadet => (
                <div
                  key={cadet.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, cadet)}
                  className="bg-background dark:bg-muted/5 border border-border p-3 rounded-lg flex justify-between items-center hover:border-primary/50 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground/30 group-hover:text-primary/50">
                      <Hand size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {(cadet.first_name || '') + ' ' + (cadet.last_name || '') || 'Unnamed Trainee'}
                      </p>
                      <p className="text-xs text-muted-foreground">{cadet.rank}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCadet(cadet)}
                    className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COL: FLEET STATUS */}
        <div className="lg:col-span-2 bg-card dark:bg-muted/10 border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Ship size={18} className="text-teal-500" /> Fleet Status
              </h3>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search fleet..."
                value={searchFleet}
                onChange={(e) => setSearchFleet(e.target.value)}
                className="w-full bg-background dark:bg-background/50 pl-8 pr-3 py-1.5 rounded-md border border-input text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVessels.map(vessel => {
              const crewAssignments = assignments.filter((a: any) => {
                const aVesselId = a?.vessel?.id ?? a?.vessel_id;
                const isActive = (a?.status || '').toUpperCase() === 'ACTIVE';
                return String(aVesselId) === String(vessel.id) && isActive;
              });

              const crew = crewAssignments
                .map((a: any) => a?.trainee)
                .filter(Boolean);

              const isDragOver = dragOverVesselId === vessel.id;

              return (
                <div
                  key={vessel.id}
                  onDragOver={(e) => handleDragOver(e, vessel.id)}
                  onDragLeave={(e) => { e.preventDefault(); setDragOverVesselId(null); }}
                  onDrop={(e) => handleDrop(e, vessel)}
                  className={`border rounded-lg p-4 space-y-3 h-fit transition-all duration-200 ${
                    isDragOver
                      ? 'border-dashed border-2 border-primary bg-primary/5 scale-[1.02]'
                      : 'bg-background dark:bg-muted/5 border-border'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-bold ${isDragOver ? 'text-primary' : 'text-foreground'}`}>
                        {vessel.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{vessel.vessel_type}</p>
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                      {crew.length} Trainees
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    {crew.length === 0 && !isDragOver && (
                      <p className="text-xs text-muted-foreground italic">
                        No trainees onboard.
                      </p>
                    )}

                    {crew.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 text-sm text-foreground bg-muted/20 p-2 rounded group"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(c.first_name || 'C').charAt(0)}
                          </div>
                          <span className="truncate">
                            {(c.first_name || '') + ' ' + (c.last_name || '') || 'Unnamed Trainee'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleUnassign(c)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ASSIGNMENT MODAL */}
      {selectedCadet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card dark:bg-zinc-900 w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-foreground">
              Assign {(selectedCadet.first_name || '') + ' ' + (selectedCadet.last_name || '')}
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Select Vessel
              </label>
              <select
                className="input-field bg-background border border-border w-full p-2 rounded"
                value={selectedVessel}
                onChange={(e) => setSelectedVessel(e.target.value)}
              >
                <option value="">Choose Vessel...</option>
                {vessels.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Sign On Date
              </label>
              <input
                type="date"
                className="input-field bg-background border border-border w-full p-2 rounded"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setSelectedCadet(null); setSelectedVessel(''); }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
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
