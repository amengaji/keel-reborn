import React, { useEffect } from 'react';
import { X, Ship, Save } from 'lucide-react';
import { CLASSIFICATION_SOCIETIES, VESSEL_TYPES } from '../../constants/maritimeData';

interface AddVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vesselData: any) => void;
  editData?: any; 
}

const AddVesselModal: React.FC<AddVesselModalProps> = ({ isOpen, onClose, onSave, editData }) => {
  useEffect(() => {
    if (isOpen) {
      const form = document.getElementById('vesselForm') as HTMLFormElement;
      if (form) form.reset();
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSave({ ...data, id: editData?.id }); 
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2 text-foreground">
            <Ship size={20} className="text-primary" />
            <h2 className="font-bold text-lg">{editData ? 'Edit Vessel' : 'Add New Vessel'}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>

        <form id="vesselForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Vessel Name</label>
              <input name="name" required defaultValue={editData?.name} type="text" className="input-field" placeholder="e.g. MT OCEAN PRIDE" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">IMO Number</label>
              {/* FIX: Changed name to 'imo' to match VesselsPage expectation */}
              <input name="imo" required defaultValue={editData?.imo} type="text" className="input-field" placeholder="e.g. 9876543" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Flag State</label>
              <input name="flag" required defaultValue={editData?.flag} type="text" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Vessel Type</label>
              <select name="type" required defaultValue={editData?.type} className="input-field">
                <option value="">Select Type</option>
                {VESSEL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Classification Society</label>
            <select name="classSociety" required defaultValue={editData?.classSociety} className="input-field">
              <option value="">Select Class</option>
              {CLASSIFICATION_SOCIETIES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-2 py-2">
            <input 
              type="checkbox" 
              id="is_active" 
              name="is_active" 
              defaultChecked={editData ? editData.is_active : true}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">
              Vessel is currently active in fleet
            </label>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-sm">
              <Save size={16} /><span>{editData ? 'Update Vessel' : 'Save Vessel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVesselModal;