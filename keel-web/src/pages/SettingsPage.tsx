//keel-web/src/pages/SettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  Shield, Globe, Save, Users, Lock, CheckCircle, 
  AlertCircle, Plus, Trash2, ImageIcon, Key, UserCog, Clock 
} from 'lucide-react';
import { toast } from 'sonner';
import { Country, State, City } from 'country-state-city';
import { getSettings, saveSettings } from '../services/dataService';
import { getCurrentUser, changePassword, updateProfile, UserProfile } from '../services/authService';

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // -- GLOBAL SETTINGS (Admin Only) --
  const [settings, setSettings] = useState<any>(null);

  // -- PERSONAL SETTINGS (CTO/Master) --
  const [cocNumber, setCocNumber] = useState('');
  const [seamanBook, setSeamanBook] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  // Password Form State
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    // 1. Identify User Role
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCocNumber(currentUser.cocNumber || '');
      setSeamanBook(currentUser.seamanBookNumber || '');
      setMfaEnabled(currentUser.mfaEnabled || false);

      // Check for Admin privileges (Shore Admin or just ADMIN role)
      const roleName = (currentUser.role || '').toUpperCase();
      setIsAdmin(roleName === 'ADMIN' || roleName === 'SHORE_ADMIN'  || roleName === 'SUPER_ADMIN');
    }

    // 2. Load Global Settings (Even non-admins might need to see Session Timer)
    const loaded = getSettings();
    setSettings(loaded);
  }, []);

  // --- ADMIN HANDLERS ---
  const handleSaveGlobal = () => {
    saveSettings(settings);
    toast.success("System configurations updated.");
  };

  const handleGeneralChange = (field: string, value: any) => {
    setSettings({ ...settings, general: { ...settings.general, [field]: value } });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'country') {
      setSettings({ ...settings, general: { ...settings.general, country: value, state: '', city: '' } });
    } else if (name === 'state') {
      setSettings({ ...settings, general: { ...settings.general, state: value, city: '' } });
    } else {
      handleGeneralChange(name, value);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleGeneralChange('logo', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleRolePermission = (id: number, field: 'canSign' | 'canUpload') => {
    const updatedRoles = settings.roles.map((r: any) => r.id === id ? { ...r, [field]: !r[field] } : r);
    setSettings({ ...settings, roles: updatedRoles });
  };

  const handleRoleChange = (id: number, field: string, value: any) => {
     const updatedRoles = settings.roles.map((r: any) => r.id === id ? { ...r, [field]: value } : r);
    setSettings({ ...settings, roles: updatedRoles });
  };

  const handleAddRole = () => {
    const newId = Math.max(...settings.roles.map((r: any) => r.id)) + 1;
    const newRole = { id: newId, name: 'NEW_ROLE', description: 'Desc', canSign: false, canUpload: false, verifyLevel: 0 };
    setSettings({ ...settings, roles: [...settings.roles, newRole] });
    toast.info("New role added.");
  };

  const handleDeleteRole = (id: number) => {
    if (confirm("Delete this role?")) {
      const updatedRoles = settings.roles.filter((r: any) => r.id !== id);
      setSettings({ ...settings, roles: updatedRoles });
    }
  };

  const handleRuleChange = (field: string, value: boolean) => {
    setSettings({ ...settings, rules: { ...settings.rules, [field]: value } });
  };
  
  // --- PERSONAL PROFILE HANDLERS ---
  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, {
        cocNumber,
        seamanBookNumber: seamanBook,
        mfaEnabled
      });
      toast.success("Professional profile updated.");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passForm.new !== passForm.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    try {
      await changePassword(user.id, passForm.current, passForm.new);
      toast.success("Password changed successfully.");
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!settings || !user) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  // ==================================================================================
  // VIEW 1: COMMAND TEAM (CTO / Master) - "Personal & Session Settings"
  // ==================================================================================
  if (!isAdmin) {
    return (
      <div className="max-w-3xl space-y-6 animate-in fade-in duration-500 pb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your professional details and account security.</p>
        </div>

        {/* 1. PROFESSIONAL DETAILS */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-2">
            <UserCog className="text-primary" size={18} />
            <h2 className="font-semibold text-foreground">Professional Details</h2>
          </div>
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Rank / Role</label>
                 <input disabled value={user.role} className="input-field w-full bg-muted/50 cursor-not-allowed" />
               </div>
               <div>
                 <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
                 <input disabled value={user.email} className="input-field w-full bg-muted/50 cursor-not-allowed" />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-muted-foreground uppercase">CoC Number</label>
                 <input 
                   value={cocNumber} 
                   onChange={(e) => setCocNumber(e.target.value)}
                   className="input-field w-full" 
                   placeholder="Enter CoC Number"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-bold text-muted-foreground uppercase">Seaman Book Number</label>
                 <input 
                   value={seamanBook} 
                   onChange={(e) => setSeamanBook(e.target.value)}
                   className="input-field w-full" 
                   placeholder="Enter CDC Number"
                 />
               </div>
             </div>
             <div className="flex justify-end pt-2">
                <button onClick={handleUpdateProfile} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-all">
                   Save Details
                </button>
             </div>
          </div>
        </div>

        {/* 2. SECURITY (Password & MFA) */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-2">
            <Shield className="text-primary" size={18} />
            <h2 className="font-semibold text-foreground">Account Security</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* CHANGE PASSWORD */}
             <form onSubmit={handleChangePassword} className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Key size={14}/> Change Password</h3>
                <input 
                  type="password" placeholder="Current Password" required
                  value={passForm.current} onChange={(e) => setPassForm({...passForm, current: e.target.value})}
                  className="input-field w-full"
                />
                <input 
                  type="password" placeholder="New Password" required
                  value={passForm.new} onChange={(e) => setPassForm({...passForm, new: e.target.value})}
                  className="input-field w-full"
                />
                <input 
                  type="password" placeholder="Confirm New Password" required
                  value={passForm.confirm} onChange={(e) => setPassForm({...passForm, confirm: e.target.value})}
                  className="input-field w-full"
                />
                <button type="submit" className="w-full bg-muted hover:bg-muted/80 text-foreground text-xs font-bold py-2 rounded border border-border">
                   Update Password
                </button>
             </form>

             {/* MFA TOGGLE */}
             <div className="space-y-3 border-l border-border pl-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Lock size={14}/> 2-Factor Authentication</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                   Secure your account. When enabled, we will send an OTP to your registered email upon login.
                </p>
                <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-border/50 mt-2">
                   <span className="text-sm font-medium">Email MFA</span>
                   <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input 
                        type="checkbox" 
                        name="toggle" 
                        id="mfa-toggle" 
                        checked={mfaEnabled}
                        onChange={(e) => {
                           setMfaEnabled(e.target.checked);
                           updateProfile(user.id, { mfaEnabled: e.target.checked })
                             .then(() => toast.success(`MFA ${e.target.checked ? 'Enabled' : 'Disabled'}`))
                             .catch(() => toast.error("Failed to toggle MFA"));
                        }}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-400"
                        style={{ right: mfaEnabled ? '0' : 'auto', left: mfaEnabled ? 'auto' : '0' }}
                      />
                      <label htmlFor="mfa-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${mfaEnabled ? 'bg-green-400' : 'bg-gray-300'}`}></label>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* 3. SESSION TIMER (Read-Only/View) */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-2">
            <Clock className="text-primary" size={18} />
            <h2 className="font-semibold text-foreground">Session Configuration</h2>
          </div>
          <div className="p-6 flex items-center justify-between">
             <div className="space-y-1">
               <p className="text-sm font-medium text-foreground">Auto-Logout Timer</p>
               <p className="text-xs text-muted-foreground">Your session will expire after inactivity.</p>
             </div>
             <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-mono font-bold text-lg">
                {settings.general.sessionTimeout} MIN
             </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // VIEW 2: ADMIN VIEW (Global Config) - Original Functionality Preserved
  // ==================================================================================
  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings (Admin)</h1>
        <p className="text-muted-foreground text-sm">Configure company profile, security, and user roles.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* GENERAL CONFIG */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-2">
            <Globe className="text-primary" size={18} />
            <h2 className="font-semibold text-foreground">General Information</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Company Name</label>
                <input 
                  type="text" 
                  value={settings.general.orgName} 
                  onChange={(e) => handleGeneralChange('orgName', e.target.value)}
                  className="input-field w-full p-2 rounded-md bg-background border border-input" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Session Time (Minutes)</label>
                <input 
                  type="number" min="5"
                  value={settings.general.sessionTimeout}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleGeneralChange('sessionTimeout', isNaN(val) ? 5 : Math.max(5, val));
                  }}
                  className="input-field w-full p-2 rounded-md bg-background border border-input" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Company Address</label>
                <textarea 
                  rows={3}
                  value={settings.general.address}
                  onChange={(e) => handleGeneralChange('address', e.target.value)}
                  className="input-field w-full p-2 rounded-md bg-background border border-input resize-none" 
                  placeholder="Street address, building, etc."
                />
              </div>
            </div>

            {/* LOGO UPLOAD */}
            <div className="space-y-4">
               <label className="text-xs font-bold text-muted-foreground uppercase">Company Logo</label>
               <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-muted/10">
                 {settings.general.logo ? (
                   <div className="relative group w-full flex flex-col items-center">
                     <img 
                       src={settings.general.logo} 
                       alt="Company Logo" 
                       style={{ width: `${settings.general.logoWidth}px` }}
                       className="object-contain max-h-25 mb-4 border border-border rounded"
                     />
                     <div className="w-full max-w-50 space-y-2">
                        <label className="text-[10px] text-muted-foreground uppercase font-bold">Resize Logo</label>
                        <input 
                          type="range" 
                          min="50" max="300" 
                          value={settings.general.logoWidth} 
                          onChange={(e) => handleGeneralChange('logoWidth', e.target.value)}
                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                     </div>
                     <button 
                       onClick={() => handleGeneralChange('logo', null)}
                       className="mt-4 text-xs text-red-500 hover:text-red-600 underline"
                     >
                       Remove Logo
                     </button>
                   </div>
                 ) : (
                   <div className="text-center py-6">
                     <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                       <ImageIcon size={24} />
                     </div>
                     <label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors inline-block">
                       <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                       Upload Logo
                     </label>
                     <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 1MB</p>
                   </div>
                 )}
               </div>
            </div>

            {/* LOCATION */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border">
               <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Country</label>
                  <select 
                    name="country" 
                    value={settings.general.country} 
                    onChange={handleLocationChange} 
                    className="input-field w-full p-2 rounded-md bg-background border border-input"
                  >
                    <option value="">Select Country</option>
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">State</label>
                  <select 
                    name="state" 
                    value={settings.general.state} 
                    onChange={handleLocationChange} 
                    disabled={!settings.general.country}
                    className="input-field w-full p-2 rounded-md bg-background border border-input disabled:opacity-50"
                  >
                    <option value="">Select State</option>
                    {State.getStatesOfCountry(settings.general.country).map((s) => (
                      <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">City</label>
                  <select 
                    name="city" 
                    value={settings.general.city} 
                    onChange={handleLocationChange}
                    disabled={!settings.general.state}
                    className="input-field w-full p-2 rounded-md bg-background border border-input disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {City.getCitiesOfState(settings.general.country, settings.general.state).map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Pin Code</label>
                  <input 
                    name="pincode"
                    type="text" 
                    value={settings.general.pincode} 
                    onChange={(e) => handleGeneralChange('pincode', e.target.value)}
                    className="input-field w-full p-2 rounded-md bg-background border border-input" 
                  />
                </div>
            </div>
          </div>
        </div>

        {/* USER ROLES */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="text-primary" size={18} />
              <h2 className="font-semibold text-foreground">User Roles & Verification Chain</h2>
            </div>
            <button 
              onClick={handleAddRole}
              className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1 font-medium"
            >
              <Plus size={14} /> Add Role
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <div className="bg-blue-500/5 p-4 border-b border-border flex gap-3">
               <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
               <div className="text-xs text-muted-foreground">
                 <strong className="text-foreground">Verification Chain:</strong> Defined by the "Verify Level". 
                 Lower levels must be verified by higher levels (e.g., Level 0 verified by Level 1).
               </div>
            </div>

            <table className="w-full text-left text-sm min-w-150">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="p-4 font-semibold w-1/3">Role Name & Desc</th>
                  <th className="p-4 font-semibold text-center w-24">Level</th>
                  <th className="p-4 font-semibold text-center w-24">Can Sign</th>
                  <th className="p-4 font-semibold text-center w-24">Can Upload</th>
                  <th className="p-4 font-semibold text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {settings.roles.map((role: any) => (
                  <tr key={role.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="p-4">
                      <input 
                        type="text" 
                        value={role.name} 
                        onChange={(e) => handleRoleChange(role.id, 'name', e.target.value.toUpperCase())}
                        className="font-bold text-foreground bg-transparent border-none p-0 focus:ring-0 w-full mb-1 uppercase"
                      />
                      <input 
                         type="text"
                         value={role.description}
                         onChange={(e) => handleRoleChange(role.id, 'description', e.target.value)}
                         className="text-xs text-muted-foreground bg-transparent border-b border-transparent focus:border-primary w-full outline-none pb-0.5"
                      />
                    </td>
                    <td className="p-4 text-center">
                       <input 
                         type="number" 
                         min="0" max="10"
                         value={role.verifyLevel}
                         onChange={(e) => handleRoleChange(role.id, 'verifyLevel', parseInt(e.target.value))}
                         className="w-10 text-center bg-muted/50 border border-border rounded text-xs font-bold p-1"
                       />
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleRolePermission(role.id, 'canSign')}
                        className={`p-2 rounded-md transition-colors ${role.canSign ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground opacity-50'}`}
                      >
                        {role.canSign ? <CheckCircle size={18} /> : <Lock size={18} />}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleRolePermission(role.id, 'canUpload')}
                        className={`p-2 rounded-md transition-colors ${role.canUpload ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground opacity-50'}`}
                      >
                         {role.canUpload ? <CheckCircle size={18} /> : <Lock size={18} />}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRB RULES */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center space-x-2">
            <Shield className="text-primary" size={18} />
            <h2 className="font-semibold text-foreground">TRB Compliance Rules</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Require Evidence for All Tasks</p>
                <p className="text-xs text-muted-foreground">Cadets cannot submit tasks without uploading an image or document.</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.rules.requireEvidence}
                onChange={(e) => handleRuleChange('requireEvidence', e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer" 
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-Lock TRB on Completion</p>
                <p className="text-xs text-muted-foreground">Automatically lock the record after the final review is signed.</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.rules.autoLock}
                onChange={(e) => handleRuleChange('autoLock', e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end pt-2 sticky bottom-4">
          <button 
            onClick={handleSaveGlobal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md active:scale-95"
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