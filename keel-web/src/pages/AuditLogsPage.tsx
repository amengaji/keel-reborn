import React from 'react';
import { Construction } from 'lucide-react';

const PageComponent: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Under Construction</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Module in development.</p>
      </div>
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
          <Construction className="text-slate-400" size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Coming Soon</h3>
      </div>
    </div>
  );
};

export default PageComponent;