import React, { useEffect, useState } from 'react';
import { X, Save, Layers, BookOpen, ShieldAlert, FileCheck } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
  editData?: any;
  initialData?: any;
}

const STCW_FUNCTIONS = [
  { value: '1', label: 'Function 1: Navigation' },
  { value: '2', label: 'Function 2: Cargo Handling and Stowage' },
  { value: '3', label: 'Function 3: Controlling the Operation of the Ship' },
  { value: '4', label: 'Function 4: Marine Engineering' },
  { value: '5', label: 'Function 5: Electrical, Electronic & Control Engineering' },
  { value: '6', label: 'Function 6: Maintenance and Repair' },
  { value: '7', label: 'Function 7: Radio Communications' },
];

const STCW_REFERENCES = [
  { value: 'A-II/1', label: 'A-II/1 - Deck (Operational Level)' },
  { value: 'A-II/2', label: 'A-II/2 - Deck (Management Level)' },
  { value: 'A-II/3', label: 'A-II/3 - Deck (Coastal Voyages)' },
  { value: 'A-II/4', label: 'A-II/4 - Rating Forming Part of Nav. Watch' },
  { value: 'A-II/5', label: 'A-II/5 - Able Seafarer Deck' },
  { value: 'A-III/1', label: 'A-III/1 - Engine (Operational Level)' },
  { value: 'A-III/2', label: 'A-III/2 - Engine (Management Level)' },
  { value: 'A-III/4', label: 'A-III/4 - Rating Forming Part of Eng. Watch' },
  { value: 'A-III/5', label: 'A-III/5 - Able Seafarer Engine' },
  { value: 'A-III/6', label: 'A-III/6 - Electro-Technical Officer (ETO)' },
  { value: 'A-III/7', label: 'A-III/7 - Electro-Technical Rating' },
  { value: 'A-VI/1', label: 'A-VI/1 - Basic Safety Training' },
  { value: 'A-VI/2', label: 'A-VI/2 - Survival Craft & Rescue Boats' },
  { value: 'A-VI/3', label: 'A-VI/3 - Advanced Firefighting' },
  { value: 'A-VI/4', label: 'A-VI/4 - Medical First Aid & Care' },
  { value: 'A-VI/5', label: 'A-VI/5 - Ship Security Officer' },
  { value: 'A-VI/6', label: 'A-VI/6 - Security Awareness' },
];

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, editData }) => {
  // SET DEFAULT TAB TO HIERARCHY
  const [activeTab, setActiveTab] = useState('hierarchy');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(editData || {
        safety: 'None',
        evidence: 'DOCUMENT',
        verification: 'OBSERVATION',
        frequency: 'ONCE',
        mandatory: true
      });
      // RESET TAB TO HIERARCHY ON OPEN
      setActiveTab('hierarchy');
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // UPDATED TAB ORDER
  const tabs = [
    { id: 'hierarchy', label: 'Hierarchy', icon: <Layers size={16} /> }, // Moved First
    { id: 'details', label: 'Task Details', icon: <BookOpen size={16} /> },
    { id: 'requirements', label: 'Requirements', icon: <ShieldAlert size={16} /> },
    { id: 'verification', label: 'Verification', icon: <FileCheck size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">
            {editData ? 'Edit TRB Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-border bg-muted/30 px-4 pt-2 space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id 
                ? 'bg-card text-primary border-t border-x border-border -mb-px shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* FORM BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="taskForm" onSubmit={handleSubmit} className="space-y-6">

            {/* TAB 1: HIERARCHY & CODES (NOW FIRST) */}
            {activeTab === 'hierarchy' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Function / Part Number</label>
                      <select name="partNum" required value={formData.partNum || ''} onChange={handleChange} className="input-field">
                        <option value="">Select Function...</option>
                        {STCW_FUNCTIONS.map(func => (
                          <option key={func.value} value={func.value}>{func.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">STCW Reference</label>
                      <select name="stcw" value={formData.stcw || ''} onChange={handleChange} className="input-field">
                        <option value="">Select Reference...</option>
                        {STCW_REFERENCES.map(ref => (
                          <option key={ref.value} value={ref.value}>{ref.label}</option>
                        ))}
                      </select>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Section / Topic Name</label>
                    <input name="section" required value={formData.section || ''} onChange={handleChange} className="input-field" placeholder="e.g. Plan and Conduct a Passage" />
                    <p className="text-[10px] text-muted-foreground">Tasks will be grouped under this Section heading in the viewer.</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Department</label>
                      <select name="dept" value={formData.dept || ''} onChange={handleChange} className="input-field">
                        <option value="Deck">Deck</option>
                        <option value="Engine">Engine</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Galley">Galley</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Trainee Rank</label>
                      <select name="traineeType" value={formData.traineeType || ''} onChange={handleChange} className="input-field">
                        <option value="DECK_CADET">Deck Cadet</option>
                        <option value="ENGINE_CADET">Engine Cadet</option>
                        <option value="ETO_CADET">ETO Cadet</option>
                        <option value="RATING">Rating / Crew</option>
                      </select>
                    </div>
                 </div>
              </div>
            )}

            {/* TAB 2: CORE DETAILS */}
            {activeTab === 'details' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Task Title</label>
                  <input name="title" required value={formData.title || ''} onChange={handleChange} className="input-field" placeholder="e.g. Steer the ship and comply with helm orders" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Description / Competence</label>
                  <input name="description" value={formData.description || ''} onChange={handleChange} className="input-field" placeholder="e.g. Navigation at the Operational Level" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Detailed Instructions</label>
                  <textarea 
                    name="instruction" 
                    rows={4} 
                    value={formData.instruction || ''} 
                    onChange={handleChange} 
                    className="input-field min-h-25" 
                    placeholder="Step-by-step instructions for the trainee..."
                  />
                </div>
              </div>
            )}

            {/* TAB 3: REQUIREMENTS */}
            {activeTab === 'requirements' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Safety Requirements</label>
                      <input name="safety" value={formData.safety || ''} onChange={handleChange} className="input-field" placeholder="e.g. Wear PPE, Risk Assessment Required" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Frequency</label>
                      <select name="frequency" value={formData.frequency || 'ONCE'} onChange={handleChange} className="input-field">
                        <option value="ONCE">Once</option>
                        <option value="TWICE">Twice</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="EVERY_VOYAGE">Every Voyage</option>
                        <option value="EVERY_VESSEL">Every Vessel</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border mt-6">
                      <input 
                        type="checkbox" 
                        name="mandatory" 
                        checked={formData.mandatory || false} 
                        onChange={handleChange} 
                        className="w-5 h-5 accent-primary" 
                      />
                      <div>
                          <p className="text-sm font-bold text-foreground">Mandatory Task</p>
                          <p className="text-xs text-muted-foreground">Required for TRB completion.</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {/* TAB 4: VERIFICATION */}
            {activeTab === 'verification' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Evidence Type</label>
                      <select name="evidence" value={formData.evidence || 'DOCUMENT/PHOTO'} onChange={handleChange} className="input-field">
                        <option value="DOCUMENT/PHOTO">Document / Photo</option>
                        <option value="NONE">No Evidence Required</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Verification Method</label>
                      <select name="verification" value={formData.verification || 'OBSERVATION'} onChange={handleChange} className="input-field">
                        <option value="OBSERVATION">Physical Observation</option>
                        <option value="Q&A">Q&A Session</option>
                        <option value="WRITTEN">Written Report</option>
                      </select>
                    </div>
                 </div>
                 
                 <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                    <p className="font-bold">Verification Policy</p>
                    <p className="mt-1">
                       Setting 'Physical Observation' will require the onboard Officer to physically sign off on this task via their dashboard.
                    </p>
                 </div>
              </div>
            )}

          </form>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex justify-end space-x-3 bg-card rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button form="taskForm" type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-sm">
            <Save size={16} />
            <span>{editData ? 'Update Task' : 'Create Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;