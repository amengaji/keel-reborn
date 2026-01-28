//keel-web/src/pages/master/CertificatePreviewPage.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import SteeringCertificate from './SteeringCertificate';
import { cadetService } from '../../services/cadetService';

const CertificatePreviewPage: React.FC = () => {
  const { cadetId } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [cadetData, setCadetData] = useState<any>(null);
  const [watchStats, setWatchStats] = useState<any>({ steering_hours: 0 });

  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: `Steering_Cert_${cadetData?.last_name || 'Cadet'}`,
    onAfterPrint: () => toast.success("Certificate generated successfully")
  });

  useEffect(() => {
    if (!cadetId) return;
    loadData();
  }, [cadetId]);

  const loadData = async () => {
    try {
      // 1. Fetch Profile
      const profile = await cadetService.getById(parseInt(cadetId!));
      setCadetData(profile);

      // 2. Fetch Watchkeeping Stats (Real DB Hours)
      const stats = await cadetService.getWatchStats(parseInt(cadetId!));
      setWatchStats(stats);

    } catch (err) {
      console.error(err);
      toast.error("Error", { description: "Could not sync sea service data." });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm font-medium text-muted-foreground">Calculating Sea Time...</p>
        </div>
      </div>
    );
  }

  if (!cadetData) return <div>Data not found</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Certificate Preview</h1>
            <p className="text-xs text-slate-500">
               Based on {watchStats.total_logs || 0} verified watch entries
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button 
            onClick={() => handlePrint()}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:brightness-110 shadow-md transition-all active:scale-95"
          >
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <div className="shadow-2xl">
          <div ref={componentRef}>
            <SteeringCertificate 
              traineeName={`${cadetData.first_name} ${cadetData.last_name}`}
              rank={cadetData.rank || "Deck Cadet"}
              indos={cadetData.indos_number || "N/A"}
              vesselName={cadetData.vessel || "MV KEEL TRAINER"}
              completionDate={new Date().toLocaleDateString()}
              // ✅ REAL DATA INJECTED HERE
              hoursSteered={watchStats.steering_hours || 0} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreviewPage;