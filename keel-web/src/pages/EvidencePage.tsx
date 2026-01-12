import React from 'react';
import { Archive } from 'lucide-react';

const EvidencePage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Evidence Repository</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Centralized archive of all uploaded proofs.</p>
      </div>
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
          <Archive className="text-slate-400" size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">File Archive</h3>
        <p className="text-slate-500 text-sm">No files currently indexed.</p>
      </div>
    </div>
  );
};

export default EvidencePage;