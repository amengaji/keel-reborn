// amengaji/keel-reborn/keel-reborn-8e3419f76262b0acdc74d700afab81401a9542d0/keel-web/src/components/vessels/AddVesselModal.tsx

import React, { useEffect } from 'react';
import { X, Ship, Save } from 'lucide-react';
import { CLASSIFICATION_SOCIETIES, VESSEL_TYPES } from '../../constants/maritimeData';

interface AddVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vesselData: any) => void;
  editData?: any; 
}

/**
 * AddVesselModal Component
 * Modal component for adding or editing a vessel entry.
 * FIXED: Theming updated to use semantic variables for clean light/dark mode transitions.
 */
const AddVesselModal: React.FC<AddVesselModalProps> = ({ isOpen, onClose, onSave, editData }) => {
  
  /**
   * Effect: Reset or populate the form when the modal opens or data changes.
   * Ensures 'Add' mode starts with a clean slate while 'Edit' mode preserves existing data.
   */
  useEffect(() => {
    if (isOpen) {
      const form = document.getElementById('vesselForm') as HTMLFormElement;
      if (form && !editData) form.reset();
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  /**
   * handleSubmit
   * Captures form submission, converts it to a plain object, and passes it to the parent.
   * Handles the 'is_active' checkbox specifically to ensure it returns a boolean value.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    // Explicitly check for the checkbox 'on' status to send true/false to SQL
    const payload = {
      ...data,
      is_active: formData.get('is_active') === 'on'
    };
    
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Container uses bg-card to follow the light mode (white) and dark mode (slate-900) settings */}
      <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 transition-colors duration-300">
        
        {/* MODAL HEADER: Connected to theme text colors */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2 text-foreground">
            <Ship size={20} className="text-primary" />
            <h2 className="font-bold text-lg">{editData ? 'Edit Vessel Details' : 'Add New Vessel'}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY - FORM: Utilizing .input-field from index.css layers */}
        <form id="vesselForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vessel Name</label>
              <input 
                name="name" 
                required 
                defaultValue={editData?.name} 
                type="text" 
                className="input-field" 
                placeholder="e.g. MT OCEAN PRIDE" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IMO Number</label>
              <input 
                name="imo" 
                required 
                defaultValue={editData?.imo_number || editData?.imo} 
                type="text" 
                className="input-field" 
                placeholder="e.g. 9876543" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Flag State</label>
              <input 
                name="flag" 
                required 
                defaultValue={editData?.flag} 
                type="text" 
                className="input-field" 
                placeholder="e.g. Panama"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vessel Type</label>
              <select 
                name="type" 
                required 
                defaultValue={editData?.vessel_type} 
                className="input-field cursor-pointer"
              >
                <option value="">Select Type</option>
                {VESSEL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Classification Society</label>
            <select 
              name="class_society" 
              required 
              defaultValue={editData?.class_society} 
              className="input-field cursor-pointer"
            >
              <option value="">Select Class</option>
              {CLASSIFICATION_SOCIETIES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-3 py-2">
            <input 
              type="checkbox" 
              id="is_active" 
              name="is_active" 
              defaultChecked={editData ? editData.is_active : true}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary bg-background"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-foreground cursor-pointer select-none">
              Vessel is currently active in fleet
            </label>
          </div>

          {/* MODAL FOOTER: Explicit spacing and high-contrast buttons */}
          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Save size={16} />
              <span>{editData ? 'Update Vessel' : 'Save Vessel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVesselModal;