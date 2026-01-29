//keel-web/src/pages/master/MasterReviewPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  ArrowLeft, 
  Calendar, 
  Star, 
  MessageSquare, 
  ShieldCheck,
  History,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cadetService } from '../../services/cadetService';

const MasterReviewPage: React.FC = () => {
  const { cadetId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cadet, setCadet] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [watchStats, setWatchStats] = useState<any>({ steering_hours: 0, bridge_hours: 0 });

  // Form State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (cadetId) loadData();
  }, [cadetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const id = parseInt(cadetId!);
      const [profile, reviews, stats] = await Promise.all([
        cadetService.getById(id),
        fetch(`http://localhost:5000/api/reviews/cadet/${id}`, { 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('keel_token')}` } 
        }).then(res => res.json()),
        cadetService.getWatchStats(id)
      ]);

      setCadet(profile);
      setHistory(Array.isArray(reviews) ? reviews : []);
      setWatchStats(stats);
    } catch (err) {
      toast.error("Error", { description: "Failed to load review data." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments || comments.length < 20) {
      return toast.error("Validation Error", { description: "Please provide a more detailed monthly statement (min 20 chars)." });
    }

    try {
      setSubmitting(true);
      const res = await fetch(`http://localhost:5000/api/reviews/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keel_token')}` 
        },
        body: JSON.stringify({
          userId: cadet.id,
          vesselId: cadet.vessel_id,
          month,
          year,
          performanceScore: score,
          comments
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Review Submitted", { description: "The monthly statement has been recorded and signed." });
      setComments('');
      loadData(); // Refresh history
    } catch (err: any) {
      toast.error("Submission Failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Monthly Training Review</h1>
          <p className="text-muted-foreground">Appraising {cadet.first_name} {cadet.last_name} • {cadet.rank}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <ClipboardCheck size={20} />
              <h2 className="font-bold uppercase text-xs tracking-widest">New Monthly Statement</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Period Month</label>
                  <select 
                    value={month} 
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Period Year</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Performance Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScore(s)}
                      className={`flex-1 p-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                        score === s ? 'bg-primary text-white border-primary shadow-lg' : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {s} <Star size={14} fill={score === s ? 'white' : 'transparent'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Master's Remarks / Guidance</label>
                <textarea 
                  rows={5}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Detail the cadet's progress, strengths, and areas requiring more practical training..."
                  className="w-full bg-background border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button 
                disabled={submitting}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} /> Sign & Finalize Review</>}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: HISTORY & STATS */}
        <div className="space-y-6">
          {/* STATS PREVIEW */}
          <div className="bg-primary text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <Clock className="absolute -right-4 -bottom-4 opacity-10" size={120} />
             <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-4">Activity Snapshot</h3>
             <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end border-b border-white/20 pb-2">
                   <span className="text-xs">Steering Hours</span>
                   <span className="text-xl font-bold">{watchStats.steering_hours}h</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/20 pb-2">
                   <span className="text-xs">Total Bridge Time</span>
                   <span className="text-xl font-bold">{watchStats.bridge_hours}h</span>
                </div>
             </div>
          </div>

          {/* HISTORY LIST */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-75">
            <div className="flex items-center gap-2 mb-6 text-muted-foreground">
              <History size={18} />
              <h2 className="font-bold uppercase text-xs tracking-widest">Review History</h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="mx-auto text-muted-foreground/30 mb-2" size={32} />
                <p className="text-xs text-muted-foreground italic">No previous reviews recorded.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((rev) => (
                  <div key={rev.id} className="p-4 border border-border rounded-xl bg-muted/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs">{new Date(0, rev.review_month - 1).toLocaleString('en', { month: 'short' })} {rev.review_year}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: rev.performance_score }).map((_, i) => (
                          <Star key={i} size={10} className="text-orange-500" fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic">"{rev.comments}"</p>
                    <div className="pt-2 border-t border-border flex justify-between items-center text-[9px] uppercase font-bold text-primary">
                       <span>Signed by: {rev.reviewer?.rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterReviewPage;