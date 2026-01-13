import React, { useEffect, useState } from 'react';
import { Ship, ArrowRight, UserCheck, Hand, Search } from 'lucide-react';
import { getCadets, getVessels, assignCadetToVessel } from '../services/dataService';
import { toast } from 'sonner';

const AssignmentsPage: React.FC = () => {
  const [cadets, setCadets] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  
  // MODAL STATE
  const [selectedCadet, setSelectedCadet] = useState<any>(null);
  const [assignDate, setAssignDate] = useState('');
  const [selectedVessel, setSelectedVessel] = useState('');

  // DRAG STATE
  const [dragOverVesselId, setDragOverVesselId] = useState<number | null>(null);

  // SEARCH STATES (NEW)
  const [searchReady, setSearchReady] = useState('');
  const [searchFleet, setSearchFleet] = useState('');

  const refreshData = () => {
    setCadets(getCadets());
    setVessels(getVessels());
  };

  useEffect(() => { refreshData(); }, []);

  const handleAssign = () => {
    if (!selectedCadet || !selectedVessel || !assignDate) {
      toast.error("Please fill all assignment details.");
      return;
    }
    assignCadetToVessel(selectedCadet.id, selectedVessel, assignDate);
    toast.success(`${selectedCadet.name} assigned to ${selectedVessel}`);
    setSelectedCadet(null); setSelectedVessel(''); setAssignDate(''); refreshData(); 
  };

  // DRAG HANDLERS
  const handleDragStart = (e: React.DragEvent, cadet: any) => {
    e.dataTransfer.setData("cadet", JSON.stringify(cadet));
  };
  const handleDragOver = (e: React.DragEvent, vesselId: number) => {
    e.preventDefault(); setDragOverVesselId(vesselId);
  };
  const handleDrop = (e: React.DragEvent, vessel: any) => {
    e.preventDefault(); setDragOverVesselId(null);
    const cadet = JSON.parse(e.dataTransfer.getData("cadet"));
    setSelectedCadet(cadet); setSelectedVessel(vessel.name);
  };

  // FILTER LOGIC
  const readyCadets = cadets
    .filter(c => c.status === 'Ready' || c.status === 'Leave')
    .filter(c => c.name.toLowerCase().includes(searchReady.toLowerCase()) || c.rank.toLowerCase().includes(searchReady.toLowerCase()));

  const filteredVessels = vessels.filter(v => 
    v.name.toLowerCase().includes(searchFleet.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trainee Assignments</h1> {/* RENAMED */}
        <p className="text-muted-foreground text-sm">Drag 'Ready' trainees to vessels to assign them.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* LEFT COL: READY POOL */}
        <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
            <div className="flex justify-between items-center">
               <h3 className="font-semibold text-foreground flex items-center gap-2">
                 <UserCheck size={18} className="text-blue-500"/> Ready Pool
               </h3>
               <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">{readyCadets.length}</span>
            </div>
            {/* SEARCH BAR READY POOL */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search trainees..." 
                value={searchReady}
                onChange={(e) => setSearchReady(e.target.value)}
                className="w-full bg-background pl-8 pr-3 py-1.5 rounded-md border border-input text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {readyCadets.map(cadet => (
              <div 
                key={cadet.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, cadet)}
                className="bg-background border border-border p-3 rounded-lg flex justify-between items-center hover:border-primary/50 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground/30 group-hover:text-primary/50"><Hand size={14} /></div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{cadet.name}</p>
                    <p className="text-xs text-muted-foreground">{cadet.rank}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCadet(cadet)} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white">
                  <ArrowRight size={12}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COL: FLEET STATUS */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
             <div className="flex justify-between items-center">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Ship size={18} className="text-teal-500"/> Fleet Status
                </h3>
             </div>
             {/* SEARCH BAR FLEET */}
             <div className="relative">
              <Search className="absolute left-2.5 top-2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search vessels..." 
                value={searchFleet}
                onChange={(e) => setSearchFleet(e.target.value)}
                className="w-full bg-background pl-8 pr-3 py-1.5 rounded-md border border-input text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVessels.map(vessel => {
              const crew = cadets.filter(c => c.vessel === vessel.name && c.status === 'Onboard');
              const isDragOver = dragOverVesselId === vessel.id;
              // LOGIC: 0 Trainee, 1 Trainee, 2 Trainees
              const label = crew.length === 1 ? '1 Trainee' : `${crew.length} Trainees`;
              
              return (
                <div 
                  key={vessel.id} 
                  onDragOver={(e) => handleDragOver(e, vessel.id)}
                  onDragLeave={(e) => { e.preventDefault(); setDragOverVesselId(null); }}
                  onDrop={(e) => handleDrop(e, vessel)}
                  className={`border rounded-lg p-4 space-y-3 h-fit transition-all duration-200 ${
                    isDragOver ? 'border-dashed border-2 border-primary bg-primary/5 scale-[1.02]' : 'bg-background border-border'
                  }`}
                >
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold ${isDragOver ? 'text-primary' : 'text-foreground'}`}>{vessel.name}</h4>
                        <p className="text-xs text-muted-foreground">{vessel.type}</p>
                      </div>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{label}</span> {/* UPDATED LABEL */}
                   </div>
                   
                   <div className="space-y-2 pt-2 border-t border-border">
                      {crew.length === 0 && !isDragOver && <p className="text-xs text-muted-foreground italic">No trainees onboard.</p>}
                      {crew.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-sm text-foreground bg-muted/20 p-2 rounded">
                           <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{c.name.charAt(0)}</div>
                           <span className="truncate flex-1">{c.name}</span>
                        </div>
                      ))}
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedCadet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
             <h3 className="font-bold text-lg text-foreground">Assign {selectedCadet.name}</h3>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Select Vessel</label>
                <select className="input-field" value={selectedVessel} onChange={(e) => setSelectedVessel(e.target.value)}>
                   <option value="">Choose Vessel...</option>
                   {vessels.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Sign On Date</label>
                <input type="date" className="input-field" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
             </div>
             <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setSelectedCadet(null); setSelectedVessel(''); }} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                <button onClick={handleAssign} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Confirm</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AssignmentsPage;