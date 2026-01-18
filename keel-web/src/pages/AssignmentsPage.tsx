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
 * Restore center-aligned italics for empty vessels and fixes trainee_id mapping.
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

  // Helper function to safely get display names from first/last name
  const getTraineeName = (c: any) => {
    if (!c) return "Unknown Trainee";
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim();
    return fullName.length > 0 ? fullName : (c.rank || "Unnamed Trainee");
  };

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

  // DRAG AND DROP HANDLERS
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

  const readyCadets = cadets.filter(c => 
    (c.status === 'Ready' || c.status === 'Leave' || c.status === 'Training') &&
    getTraineeName(c).toLowerCase().includes(searchReady.toLowerCase())
  );

  const filteredVessels = vessels.filter(v =>
    (v.name || '').toLowerCase().includes(searchFleet.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col bg-slate-50 dark:bg-slate-950 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trainee Assignments</h1>
        <p className="text-slate-500 text-sm italic">Drag 'Ready' trainees to vessels to assign them.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: READY POOL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck size={18} className="text-blue-500" /> Ready Pool
              </h3>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded-full">
                {readyCadets.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search trainees..."
                value={searchReady}
                onChange={(e) => setSearchReady(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {readyCadets.map(cadet => (
              <div
                key={cadet.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cadet)}
                className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-3 rounded-lg flex justify-between items-center hover:border-blue-500 cursor-grab active:cursor-grabbing transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-300 group-hover:text-blue-500"><Hand size={14} /></div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{getTraineeName(cadet)}</p>
                    <p className="text-xs text-slate-500">{cadet.rank}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCadet(cadet)}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: FLEET STATUS */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship size={18} className="text-teal-500" /> Fleet Status
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search vessels..."
                value={searchFleet}
                onChange={(e) => setSearchFleet(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-1 focus:ring-teal-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVessels.map(vessel => {
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
                  className={`border rounded-xl p-4 flex flex-col transition-all duration-200 min-h-[140px] ${
                    isDragOver ? 'border-dashed border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/10 scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`font-bold ${isDragOver ? 'text-teal-500' : 'text-slate-900 dark:text-white'}`}>{vessel.name}</h4>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-tight">{vessel.vessel_type}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 uppercase">
                      {label}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col space-y-2">
                    {crew.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-slate-400 italic">No trainees onboard.</p>
                      </div>
                    ) : (
                      crew.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded shadow-sm border dark:border-slate-700 group">
                          <div className="flex items-center gap-2 overflow-hidden truncate">
                             <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                               {c.first_name?.charAt(0)}{c.last_name?.charAt(0)}
                             </div>
                             <span className="text-sm font-semibold truncate dark:text-white">{getTraineeName(c)}</span>
                          </div>
                          <button
                            onClick={() => handleUnassign(c)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
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

      {/* ASSIGNMENT MODAL */}
      {selectedCadet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border dark:border-slate-800 space-y-4 animate-in zoom-in-95">
             <h3 className="font-bold text-lg dark:text-white">Assign {getTraineeName(selectedCadet)}</h3>
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Target Vessel</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-lg text-sm dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                >
                  <option value="">-- Choose Vessel --</option>
                  {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Sign On Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-lg text-sm dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                />
             </div>
             <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => { setSelectedCadet(null); setSelectedVesselId(''); }} className="text-sm text-slate-500 font-semibold hover:text-slate-800 dark:hover:text-slate-200">Cancel</button>
                <button onClick={handleAssign} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">Confirm Assignment</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;