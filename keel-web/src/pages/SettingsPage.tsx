import React from 'react';
import { Settings, Shield, Bell, Database, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  const handleSave = () => {
    toast.success("System configurations updated successfully.");
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-sm">Configure global TRB rules, security, and notifications.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* SECTION: GENERAL CONFIG */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
            <Globe className="text-primary" size={18} />
            <h2 className="font-bold text-slate-800">General Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Organization Name</label>
                <input type="text" defaultValue="Keel Maritime Training" className="w-full p-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">System Timezone</label>
                <select className="w-full p-2 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                  <option>UTC (Greenwich Mean Time)</option>
                  <option>SGT (Singapore Time)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: TRB RULES */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
            <Shield className="text-primary" size={18} />
            <h2 className="font-bold text-slate-800">TRB Compliance Rules</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-bold text-slate-900">Require Evidence for All Tasks</p>
                <p className="text-xs text-slate-500">Cadets cannot submit tasks without uploading an image or document.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-bold text-slate-900">Auto-Lock TRB on Completion</p>
                <p className="text-xs text-slate-500">Automatically lock the record after the final review is signed.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md active:scale-95"
          >
            <Save size={18} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;