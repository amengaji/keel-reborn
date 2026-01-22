//keel-web/src/components/vessels/AddVesselModal.tsx

import React, { useEffect, useState } from 'react';
import { X, Ship, Save, Users, Wand2, Info, KeyRound } from 'lucide-react';
import { CLASSIFICATION_SOCIETIES, VESSEL_TYPES } from '../../constants/maritimeData';

interface AddVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vesselData: any) => void;
  editData?: any; 
}

/**
 * AddVesselModal Component
 * IMPROVED UI: High contrast text for CTO box and compacted layout.
 */
const AddVesselModal: React.FC<AddVesselModalProps> = ({ isOpen, onClose, onSave, editData }) => {
  const [imoNumber, setImoNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      const form = document.getElementById('vesselForm') as HTMLFormElement;
      
      if (editData) {
        const existingImo = String(
            editData.imo_number || 
            editData.imoNumber || 
            editData.imo || 
            ''
        );
        setImoNumber(existingImo);
      } else {
        setImoNumber('');
        if (form) form.reset();
      }
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const fillDefaultEmails = () => {
    const form = document.getElementById('vesselForm') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('email_master') as HTMLInputElement).value = 'master@keel.com';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    const payload: any = {
      name: data.name,
      imo_number: imoNumber,
      flag: data.flag,
      vessel_type: data.type,
      class_society: data.class_society,
      is_active: formData.get('is_active') === 'on',
      crewEmails: {
        master: data.email_master
      }
    };

    if (editData) {
      payload.id = editData.id;
    }
    
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 transition-colors duration-300 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center space-x-2 text-foreground">
            <Ship size={20} className="text-primary" />
            <h2 className="font-bold text-lg">{editData ? 'Edit Vessel Details' : 'Add New Vessel'}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form id="vesselForm" onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* SECTION 1: VESSEL PARTICULARS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1 mb-3">
              Vessel Particulars
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={imoNumber} 
                  onChange={(e) => setImoNumber(e.target.value)}
                  type="text" 
                  className="input-field font-mono text-primary font-bold" 
                  placeholder="e.g. 9876543" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* SECTION 2: COMMAND TEAM CREDENTIALS */}
          <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-border pb-1 mb-3">
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <Users size={14} /> Command Team Access
               </h3>
               <button 
                 type="button" 
                 onClick={fillDefaultEmails}
                 className="text-[10px] font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded transition-colors"
               >
                 <Wand2 size={10} /> Auto-Fill Master
               </button>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-border/50">
               {/* 1. Master Email (Manual) */}
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Master Email <span className="text-red-500">*</span></label>
                 <input 
                   name="email_master" 
                   required 
                   defaultValue={editData?.crewEmails?.master} 
                   type="email" 
                   className="input-field" 
                   placeholder="master@keel.com" 
                 />
                 <p className="text-[10px] text-muted-foreground">The Captain will use this email to log in.</p>
               </div>

               {/* 2. CTO Auto-Generation Notice (IMPROVED UI) */}
               <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-3 rounded-lg shadow-sm">
                  
                  {/* Header */}
                  <div className="flex gap-2 items-center mb-2">
                    <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-100">CTO Accounts Auto-Generated</span>
                  </div>

                  {/* Explanation */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 ml-6 leading-snug">
                     Login IDs are automatically created based on the IMO Number:
                  </p>
                  
                  {/* ID List Box */}
                  <div className="ml-6 bg-white dark:bg-slate-900/50 p-2 rounded border border-blue-100 dark:border-blue-900/50">
                    <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-200">
                       <li className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                          <span className="opacity-70">Deck</span> 
                          <span className="font-bold text-blue-700 dark:text-blue-300">ctodeck.{imoNumber || '...'}</span>
                       </li>
                       <li className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                          <span className="opacity-70">Engine</span> 
                          <span className="font-bold text-blue-700 dark:text-blue-300">ctoeng.{imoNumber || '...'}</span>
                       </li>
                       <li className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                          <span className="opacity-70">Electrical</span> 
                          <span className="font-bold text-blue-700 dark:text-blue-300">ctoeto.{imoNumber || '...'}</span>
                       </li>
                       <li className="flex justify-between items-center">
                          <span className="opacity-70">Catering</span> 
                          <span className="font-bold text-blue-700 dark:text-blue-300">ctocat.{imoNumber || '...'}</span>
                       </li>
                    </ul>
                  </div>
                  
                  {/* Password Footer */}
                  <div className="mt-2 ml-6 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <KeyRound size={12} />
                    <span>Default Password:</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">Keel@123</code>
                  </div>
               </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-4 flex justify-end space-x-3 sticky bottom-0 bg-card border-t border-border mt-6">
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
              <span>{editData ? 'Update Vessel' : 'Save & Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVesselModal;