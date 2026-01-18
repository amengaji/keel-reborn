// keel-web/src/pages/AssignmentsPage.tsx

import React, { useEffect, useState } from 'react';
import { Ship, ArrowRight, UserCheck, Hand, Search, UserMinus, User } from 'lucide-react'; 
import { cadetAssignmentService } from '../services/cadetAssignmentService'; 
import { cadetService } from '../services/cadetService'; 
import { vesselService } from '../services/vesselService';
import { toast } from 'sonner';

/**
 * AssignmentsPage Component
 * Connected to the SQL backend to manage real-time vessel assignments.
 * Helper comments added for clarity.
 */
const AssignmentsPage: React.FC = () => {
  const [cadets, setCadets] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCadet, setSelectedCadet] = useState<any>(null);
  const [assignDate, setAssignDate] = useState('');
  const [selectedVesselId, setSelectedVesselId] = useState('');

  const [dragOverVesselId, setDragOverVesselId] = useState<string | number | null>(null);
  const [searchReady, setSearchReady] = useState('');
  const [searchFleet, setSearchFleet] = useState('');

  // Helper function to get the name safely from a trainee object
  const getTraineeName = (c: any) => {
    if (!c) return "Unknown Trainee";
    const firstName = c.first_name || "";
    const lastName = c.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    // If name is empty, return the rank, otherwise return the name
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
        cadet_id: selectedCadet.id,
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
    if (!window.confirm(`Sign off ${getTraineeName(trainee)}?`)) return;

    try {
      await cadetAssignmentService.unassign(trainee.id);
      toast.info(`${getTraineeName(trainee)} signed off.`);
      refreshData();
    } catch (err) {
      toast.error("Could not process sign-off.");
    }
  };

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
    setSelectedVesselId(vessel.id.toString());
  };

  // Filter Pool
  const readyCadets = cadets.filter(c => 
    (c.status === 'Ready' || c.status === 'Leave' || c.status === 'Training') &&
    getTraineeName(c).toLowerCase().includes(searchReady.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col bg-slate-50 dark:bg-slate-950 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fleet Assignments</h1>
        <p className="text-slate-500 text-sm">Manage vessel crew lists via drag-and-drop.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* POOL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold dark:text-white flex items-center gap-2 mb-3">
              <UserCheck size={18} className="text-blue-500" /> Ready Pool ({readyCadets.length})
            </h3>
            <input
              type="text"
              placeholder="Search trainees..."
              value={searchReady}
              onChange={(e) => setSearchReady(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 p-2 rounded-lg border dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {readyCadets.map(cadet => (
              <div
                key={cadet.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cadet)}
                className="bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-700 p-3 rounded-lg flex justify-between items-center hover:border-blue-500 cursor-grab active:cursor-grabbing transition-all group"
              >
                <div>
                  <p className="font-bold text-sm dark:text-white">{getTraineeName(cadet)}</p>
                  <p className="text-xs text-slate-500">{cadet.rank}</p>
                </div>
                <button onClick={() => setSelectedCadet(cadet)} className="p-1 text-slate-400 hover:text-blue-500">
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FLEET */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold dark:text-white flex items-center gap-2">
              <Ship size={18} className="text-teal-500" /> Active Fleet Status
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {vessels.map(vessel => {
              const crew = assignments
                .filter(a => String(a.vessel_id) === String(vessel.id) && a.status === 'ACTIVE')
                .map(a => a.trainee)
                .filter(Boolean);

              const isDragOver = dragOverVesselId === vessel.id;

              return (
                <div
                  key={vessel.id}
                  onDragOver={(e) => handleDragOver(e, vessel.id)}
                  onDragLeave={() => setDragOverVesselId(null)}
                  onDrop={(e) => handleDrop(e, vessel)}
                  className={`border rounded-xl p-4 min-h-[120px] transition-all ${
                    isDragOver ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10' : 'bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold dark:text-white">{vessel.name}</h4>
                    <span className="text-[10px] bg-white dark:bg-slate-700 px-2 py-1 rounded dark:text-slate-300">
                      {crew.length} ONBOARD
                    </span>
                  </div>

                  <div className="space-y-2">
                    {crew.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded shadow-sm border dark:border-slate-700 group">
                        <div className="truncate">
                          <p className="text-sm font-bold dark:text-white truncate">{getTraineeName(c)}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{c.rank}</p>
                        </div>
                        <button onClick={() => handleUnassign(c)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* MODAL */}
      {selectedCadet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border dark:border-slate-800">
            <h3 className="font-bold text-lg dark:text-white mb-4">Assign {getTraineeName(selectedCadet)}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Select Vessel</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-lg mt-1 dark:text-white outline-none"
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                >
                  <option value="">-- Choose --</option>
                  {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Sign On Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-lg mt-1 dark:text-white outline-none"
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelectedCadet(null)} className="text-sm text-slate-500 font-semibold">Cancel</button>
              <button onClick={handleAssign} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;