import React from 'react';
import { Users } from 'lucide-react';

const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage shore-side admin access.</p>
      </div>
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
          <Users className="text-slate-400" size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Admin Users</h3>
        <p className="text-slate-500 text-sm">User list empty.</p>
      </div>
    </div>
  );
};

export default UsersPage;