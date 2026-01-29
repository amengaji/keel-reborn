// keel-web/src/pages/master/MasterReviewPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, ArrowLeft, Calendar, Star, 
  ShieldCheck, History, Clock, Loader2, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import { cadetService } from '../../services/cadetService';

const MasterReviewPage: React.FC = () => {
  const { cadetId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cadet, setCadet] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [watchStats, setWatchStats] = useState<any>({ steering_hours: 0, bridge_hours: 0 });

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [score, setScore] = useState(3);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (cadetId) loadData();
    else setError("No Cadet ID provided.");
  }, [cadetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const id = parseInt(cadetId!);
      
      const [profile, reviews, stats] = await Promise.all([
        cadetService.getById(id),
        fetch(`http://localhost:5000/api/reviews/cadet/${id}`, { 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('keel_token')}` } 
        }).then(res => res.ok ? res.json() : []),
        cadetService.getWatchStats(id).catch(() => ({ steering_hours: 0, bridge_hours: 0 }))
      ]);

      if (!profile) throw new Error("Cadet profile not found.");

      setCadet(profile);
      setHistory(Array.isArray(reviews) ? reviews : []);
      setWatchStats(stats);
    } catch (err: any) {
      console.error("Review Page Load Error:", err);
      setError(err.message || "Failed to load cadet data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments || comments.trim().length < 20) {
      return toast.error("Validation Error", { description: "Review must be at least 20 characters." });
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

      if (!res.ok) throw new Error("Submission failed");

      toast.success("Review Signed Successfully");
      setComments('');
      loadData(); 
    } catch (err: any) {
      toast.error("Submission Failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="font-bold text-xs uppercase tracking-widest">Retrieving Training Records...</p>
    </div>
  );

  if (error || !cadet) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <AlertTriangle className="text-orange-500" size={48} />
      <p className="font-bold text-lg text-foreground">Error Loading Review Page</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full transition-colors border border-border bg-card text-card-foreground shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Monthly Training Review</h1>
          <p className="text-muted-foreground text-sm font-medium">Appraising {cadet.first_name} {cadet.last_name} • <span className="text-primary font-bold">{cadet.rank}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 text-primary">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h2 className="font-black uppercase text-xs tracking-widest text-foreground">New Monthly Statement</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Formal Master's Assessment</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider">Period Month</label>
                  <select 
                    value={month} 
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full bg-accent/50 border border-border rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-card text-foreground">{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider">Period Year</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-accent/50 border border-border rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider">Performance Rating</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScore(s)}
                      className={`flex-1 min-w-[60px] p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black text-sm ${
                        score === s ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 'bg-accent/50 border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {s} <Star size={14} fill={score === s ? 'currentColor' : 'transparent'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-wider">Master's Remarks</label>
                <textarea 
                  rows={5}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Detail the cadet's progress..."
                  className="w-full bg-accent/50 border border-border rounded-2xl p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Sign & Finalize Statement</>}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: HISTORY & STATS */}
        <div className="space-y-6">
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-xl relative overflow-hidden">
             <Clock className="absolute -right-4 -bottom-4 opacity-10" size={140} />
             <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Voyage Activity</h3>
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end border-b border-primary-foreground/10 pb-3">
                   <span className="text-xs font-bold opacity-80 uppercase tracking-tighter">Steering Hours</span>
                   <span className="text-2xl font-black tracking-tight">{watchStats.steering_hours}h</span>
                </div>
                <div className="flex justify-between items-end border-b border-primary-foreground/10 pb-3">
                   <span className="text-xs font-bold opacity-80 uppercase tracking-tighter">Total Bridge Time</span>
                   <span className="text-2xl font-black tracking-tight">{watchStats.bridge_hours}h</span>
                </div>
             </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-8 text-muted-foreground">
              <History size={18} />
              <h2 className="font-black uppercase text-xs tracking-widest text-foreground">Review History</h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-muted/30 mb-4" size={48} />
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">No previous records</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((rev) => (
                  <div key={rev.id} className="p-5 border border-border rounded-2xl bg-accent/20 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs text-foreground uppercase">{new Date(0, rev.review_month - 1).toLocaleString('en', { month: 'short' })} {rev.review_year}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} className={i < rev.performance_score ? "text-orange-500" : "text-muted"} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium italic">"{rev.comments}"</p>
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