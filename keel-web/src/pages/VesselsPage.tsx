import React, { useState, useEffect } from 'react';
import { Ship, Plus, Search, Filter, MoreVertical, Loader2 } from 'lucide-react';
import { fetchVessels } from '../services/vesselService';
import { toast } from 'sonner';

/**
 * UI/UX EXPERT NOTE:
 * This page uses the Standard Admin Vessel Register pattern.
 * It is built to handle empty states and loading sequences gracefully.
 */

const VesselsPage: React.FC = () => {
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchVessels();
        // The service extracts result.data from the legacy controller response
        setVessels(data || []);
      } catch (err: any) {
        console.error("Vessel Fetch Error:", err);
        toast.error("Fleet sync failed", {
          description: "Could not reach the Admin Vessel Service."
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p className="text-sm font-medium">Synchronizing fleet data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vessel Management</h1>
          <p className="text-slate-500 text-sm">Monitor and manage the active fleet manifest.</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md active:scale-95">
          <Plus size={18} />
          <span>Add New Vessel</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or IMO..." 
              className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <button className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-sm">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        {vessels.length === 0 ? (
          <div className="p-12 text-center">
            <Ship className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-slate-900 font-bold">No Vessels Found</h3>
            <p className="text-slate-500 text-sm">The fleet manifest is currently empty.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="px-6 py-4">Vessel Name</th>
                <th className="px-6 py-4">Ship Type</th>
                <th className="px-6 py-4">IMO Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {vessels.map((vessel) => (
                <tr key={vessel.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 rounded text-primary">
                      <Ship size={16} />
                    </div>
                    <span>{vessel.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{vessel.ship_type?.name || 'N/A'}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{vessel.imo_number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                      vessel.is_active 
                        ? 'bg-green-50 text-green-600 border-green-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {vessel.is_active ? 'ACTIVE' : 'ARCHIVED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// MANDATORY: Default export for Vite/App.tsx routing
export default VesselsPage;