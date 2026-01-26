// keel-web/src/components/trainees/AssignVesselModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, Anchor, Calendar } from 'lucide-react';
import { vesselService } from '../../services/vesselService';
import { cadetAssignmentService } from '../../services/cadetAssignmentService';
import { toast } from 'sonner';

interface AssignVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainee: any;
}

const AssignVesselModal: React.FC<AssignVesselModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trainee
}) => {
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedVesselId, setSelectedVesselId] = useState<number | ''>('');
  const [signOnDate, setSignOnDate] = useState(new Date().toISOString().split('T')[0]);

  // Load Vessels on Mount
  useEffect(() => {
    if (isOpen) {
      loadVessels();
    }
  }, [isOpen]);

  const loadVessels = async () => {
    try {
      setLoading(true);
      const data = await vesselService.getAll();
      setVessels(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load vessel list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVesselId || !trainee?.id) {
      toast.error("Please select a vessel.");
      return;
    }

    setSubmitting(true);
    try {
      await cadetAssignmentService.assign({
        trainee_id: trainee.id,
        vessel_id: Number(selectedVesselId),
        sign_on_date: new Date(signOnDate).toISOString()
      });
      
      toast.success(`Assigned ${trainee.first_name} to vessel successfully.`);
      onSuccess(); // Triggers refresh in parent
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to assign trainee.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl flex flex-col">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Anchor size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Assign to Vessel</h2>
              <p className="text-xs text-muted-foreground">Deploying {trainee?.first_name} {trainee?.last_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Vessel Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Select Vessel</label>
            <select 
              required
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(Number(e.target.value))}
              disabled={loading}
              className="input-field"
            >
              <option value="">-- Choose a Vessel --</option>
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.imo_number ? `(IMO: ${v.imo_number})` : ''}
                </option>
              ))}
            </select>
            {loading && <p className="text-xs text-muted-foreground animate-pulse">Loading fleet...</p>}
          </div>

          {/* Sign On Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Calendar size={12} /> Sign On Date
            </label>
            <input 
              type="date"
              required
              value={signOnDate}
              onChange={(e) => setSignOnDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || loading}
              className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AssignVesselModal;