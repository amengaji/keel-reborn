//keel-web/src/components/vessels/AddVesselModal.tsx

import React, { useEffect } from 'react';
import { X, Ship, Save, Users, Wand2 } from 'lucide-react';
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
 * UPDATED: Command Team emails are now MANDATORY. Form cannot be saved if empty.
 */
const AddVesselModal: React.FC<AddVesselModalProps> = ({ isOpen, onClose, onSave, editData }) => {
  
  /**
   * Effect: Reset or populate the form when the modal opens or data changes.
   */
  useEffect(() => {
    if (isOpen) {
      const form = document.getElementById('vesselForm') as HTMLFormElement;
      if (form && !editData) form.reset();
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  /**
   * Helper: Auto-fill standard Keel emails for quick setup.
   */
  const fillDefaultEmails = () => {
    const form = document.getElementById('vesselForm') as HTMLFormElement;
    if (form) {
      (form.elements.namedItem('email_master') as HTMLInputElement).value = 'master@keel.com';
      (form.elements.namedItem('email_deck') as HTMLInputElement).value = 'cto.deck@keel.com';
      (form.elements.namedItem('email_engine') as HTMLInputElement).value = 'cto.engine@keel.com';
      (form.elements.namedItem('email_eto') as HTMLInputElement).value = 'cto.eto@keel.com';
      (form.elements.namedItem('email_catering') as HTMLInputElement).value = 'cto.cat@keel.com';
    }
  };

  /**
   * handleSubmit
   * Captures form submission, bundles Vessel Data + Crew Emails.
   * Note: The 'required' attribute on inputs ensures we don't get here unless fields are filled.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    // 1. Construct the Base Vessel Payload
    const payload: any = {
      name: data.name,
      imo_number: data.imo,
      flag: data.flag,
      vessel_type: data.type,
      class_society: data.class_society,
      is_active: formData.get('is_active') === 'on',
      // Always include crew emails (Mandatory)
      crewEmails: {
        master: data.email_master,
        ctoDeck: data.email_deck,
        ctoEngine: data.email_engine,
        ctoEto: data.email_eto,
        ctoCatering: data.email_catering
      }
    };

    // 2. Handle ID for Edit Mode
    if (editData) {
      payload.id = editData.id;
    }
    
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      {/* Container */}
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 transition-colors duration-300 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
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

        {/* MODAL BODY - FORM */}
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
                  defaultValue={editData?.imo_number || editData?.imo} 
                  type="text" 
                  className="input-field" 
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

          {/* SECTION 2: COMMAND TEAM CREDENTIALS (ALWAYS VISIBLE & MANDATORY) */}
          <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-border pb-1 mb-3">
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <Users size={14} /> Command Team Assignment
               </h3>
               <button 
                 type="button" 
                 onClick={fillDefaultEmails}
                 className="text-[10px] font-bold text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded transition-colors"
               >
                 <Wand2 size={10} /> Auto-Fill Defaults
               </button>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl space-y-4 border border-border/50">
               <p className="text-xs text-muted-foreground mb-2">
                 Emails are <span className="text-red-500 font-bold">Mandatory</span>. Password: <span className="font-mono font-bold text-primary">Keel@123</span>
               </p>
               
               {/* Row 1: Master & Deck */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CTO Deck Email <span className="text-red-500">*</span></label>
                    <input 
                      name="email_deck" 
                      required 
                      defaultValue={editData?.crewEmails?.ctoDeck} 
                      type="email" 
                      className="input-field" 
                      placeholder="cto.deck@keel.com" 
                    />
                  </div>
               </div>

               {/* Row 2: Engine & Electrical */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CTO Engine Email <span className="text-red-500">*</span></label>
                    <input 
                      name="email_engine" 
                      required 
                      defaultValue={editData?.crewEmails?.ctoEngine} 
                      type="email" 
                      className="input-field" 
                      placeholder="cto.engine@keel.com" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CTO Electrical Email <span className="text-red-500">*</span></label>
                    <input 
                      name="email_eto" 
                      required 
                      defaultValue={editData?.crewEmails?.ctoEto} 
                      type="email" 
                      className="input-field" 
                      placeholder="cto.eto@keel.com" 
                    />
                  </div>
               </div>

               {/* Row 3: Catering */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CTO Catering Email <span className="text-red-500">*</span></label>
                    <input 
                      name="email_catering" 
                      required 
                      defaultValue={editData?.crewEmails?.ctoCatering} 
                      type="email" 
                      className="input-field" 
                      placeholder="cto.cat@keel.com" 
                    />
                  </div>
                  <div className="flex items-end pb-1">
                     <span className="text-[10px] text-muted-foreground italic">
                       * Emails are linked to this specific vessel.
                     </span>
                  </div>
               </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
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
              <span>{editData ? 'Update Vessel' : 'Save Vessel & Create Crew'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVesselModal;