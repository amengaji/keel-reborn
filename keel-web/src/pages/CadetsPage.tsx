import React, { useState } from 'react';
import { Users, Plus, Search, Filter, MoreVertical, Anchor } from 'lucide-react';

const CadetsPage: React.FC = () => {
  // Mock Data for UI Visualization
  const [cadets] = useState([
    { id: 1, name: 'Cdt. Rahul Sharma', rank: 'Deck Cadet', vessel: 'MT MARITIME GLORY', status: 'Onboard' },
    { id: 2, name: 'Cdt. Sarah Jenkins', rank: 'Engine Cadet', vessel: 'MV OCEAN TRADER', status: 'Leave' },
    { id: 3, name: 'Cdt. Michael Chang', rank: 'Deck Cadet', vessel: 'Unassigned', status: 'Ready' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cadet Profiles</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage trainee personnel and records.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95">
          <Plus size={18} />
          <span>New Cadet</span>
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search cadets..." 
              className="w-full bg-white dark:bg-slate-950 pl-10 pr-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button className="flex items-center space-x-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>

        {/* TABLE */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4">Cadet Name</th>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Current Vessel</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {cadets.map((cadet) => (
              <tr key={cadet.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold text-xs">
                    {cadet.name.charAt(0)}
                  </div>
                  <span>{cadet.name}</span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{cadet.rank}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                   {cadet.vessel !== 'Unassigned' && <Anchor size={14} className="text-slate-400" />}
                   <span>{cadet.vessel}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                    cadet.status === 'Onboard' ? 'bg-green-50/50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                    cadet.status === 'Ready' ? 'bg-blue-50/50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                    'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {cadet.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CadetsPage;