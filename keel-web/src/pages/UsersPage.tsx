import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Lock, Edit, Trash2, Plus, 
  Search, Mail, Phone, X, Save, Check, Ban, 
  Ship, ClipboardList 
} from 'lucide-react';
import { toast } from 'sonner';
import { getShoreUsers, saveShoreUser, deleteShoreUser, getShoreRoles, saveShoreRoles } from '../services/dataService';

const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(getShoreUsers());
    setRoles(getShoreRoles());
  };

  // --- USER HANDLERS ---
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userData = {
      id: editingUser ? editingUser.id : Date.now(),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      roleId: formData.get('roleId'),
      phone: formData.get('phone'),
      status: formData.get('status'),
    };
    
    saveShoreUser(userData);
    refreshData();
    setIsUserModalOpen(false);
    setEditingUser(null);
    toast.success(editingUser ? "User updated." : "New user created.");
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Revoke access for this user?")) {
      deleteShoreUser(id);
      refreshData();
      toast.info("User access revoked.");
    }
  };

  // --- ROLE HANDLERS ---
  const handleAddRole = () => {
    const newRole = {
      id: `role_${Date.now()}`,
      name: 'NEW ROLE',
      description: 'Define permissions...',
      permissions: {
        trainees: { view: true, create: false, edit: false, delete: false },
        vessels: { view: true, create: false, edit: false, delete: false },
        tasks: { view: true, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
      }
    };
    const updated = [...roles, newRole];
    saveShoreRoles(updated);
    setRoles(updated);
    toast.info("New role added.");
  };

  const handleDeleteRole = (id: string) => {
    if (id === 'admin') return toast.error("Cannot delete Super Admin role.");
    if (users.some(u => u.roleId === id)) return toast.error("Role is in use by active users.");
    
    if (confirm("Delete this role?")) {
      const updated = roles.filter(r => r.id !== id);
      saveShoreRoles(updated);
      setRoles(updated);
    }
  };

  const updateRoleName = (id: string, name: string) => {
    const updated = roles.map(r => r.id === id ? { ...r, name: name.toUpperCase() } : r);
    saveShoreRoles(updated);
    setRoles(updated);
  };

  // MATRIX PERMISSION TOGGLE
  const togglePermission = (roleId: string, module: string, action: string) => {
    const updated = roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [module]: {
              ...role.permissions[module],
              [action]: !role.permissions[module][action]
            }
          }
        };
      }
      return role;
    });
    saveShoreRoles(updated);
    setRoles(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shore Access Control</h1>
          <p className="text-muted-foreground text-sm">Manage office staff logins and granular system permissions.</p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <Users size={16} /> Staff Directory
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'roles' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            <Shield size={16} /> Roles & Permissions
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* --- TAB 1: USERS --- */}
        {activeTab === 'users' && (
          <>
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                <input type="text" placeholder="Search staff..." className="input-field pl-9 h-9" />
              </div>
              <button 
                onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium shadow-sm"
              >
                <Plus size={16} /><span>Create Login</span>
              </button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(user => {
                    const roleName = roles.find(r => r.id === user.roleId)?.name || 'Unknown Role';
                    return (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-bold text-foreground">{user.firstName} {user.lastName}</td>
                        <td className="p-4"><span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 text-xs font-bold border border-blue-500/20">{roleName}</span></td>
                        <td className="p-4 text-muted-foreground text-xs space-y-1">
                           <div className="flex gap-2"><Mail size={12}/> {user.email}</div>
                           <div className="flex gap-2"><Phone size={12}/> {user.phone}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${user.status === 'Active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-primary"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteUser(user.id)} className="p-2 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-600"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- TAB 2: ROLES & PERMISSIONS --- */}
        {activeTab === 'roles' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-blue-500/5 flex items-center justify-between">
               <div className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                 <Shield size={16} /> Define detailed permissions for each office role.
               </div>
               <button onClick={handleAddRole} className="text-xs bg-background border border-border px-3 py-1.5 rounded hover:bg-muted font-bold shadow-sm">
                 + Add Shore Role
               </button>
            </div>
            
            <div className="overflow-auto flex-1 p-6 space-y-8">
              {roles.map(role => (
                 <div key={role.id} className="border border-border rounded-xl overflow-hidden shadow-sm bg-background">
                    {/* ROLE HEADER */}
                    <div className="bg-muted/30 p-4 border-b border-border flex justify-between items-center">
                       <div className="w-full max-w-md space-y-1">
                          <input 
                            value={role.name}
                            onChange={(e) => updateRoleName(role.id, e.target.value)}
                            disabled={role.id === 'admin'}
                            className="font-bold text-lg bg-transparent border-none p-0 focus:ring-0 w-full uppercase disabled:opacity-70"
                          />
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                       </div>
                       {role.id !== 'admin' && (
                         <button onClick={() => handleDeleteRole(role.id)} className="text-muted-foreground hover:text-red-500"><Trash2 size={18} /></button>
                       )}
                    </div>

                    {/* PERMISSION MATRIX */}
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/10 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="p-3 pl-6 font-medium w-1/4">Module</th>
                            <th className="p-3 text-center w-1/6">View</th>
                            <th className="p-3 text-center w-1/6">Create</th>
                            <th className="p-3 text-center w-1/6">Edit</th>
                            <th className="p-3 text-center w-1/6">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {['trainees', 'vessels', 'tasks', 'users'].map((module) => {
                             const perms = role.permissions[module] || { view: false, create: false, edit: false, delete: false };
                             return (
                               <tr key={module} className="hover:bg-muted/20">
                                 <td className="p-3 pl-6 font-medium capitalize text-foreground flex items-center gap-2">
                                    {/* FIX: Relevant Icons per module */}
                                    {module === 'trainees' && <Users size={14} />}
                                    {module === 'vessels' && <Ship size={14} />} 
                                    {module === 'tasks' && <ClipboardList size={14} />}
                                    {module === 'users' && <Shield size={14} />}
                                    {module} Management
                                 </td>
                                 {['view', 'create', 'edit', 'delete'].map(action => (
                                   <td key={action} className="p-3 text-center">
                                     <button 
                                       onClick={() => togglePermission(role.id, module, action)}
                                       disabled={role.id === 'admin'} // Admin always full access
                                       className={`w-8 h-8 rounded-md flex items-center justify-center transition-all mx-auto ${
                                         perms[action] 
                                         ? 'bg-green-500 text-white shadow-sm' 
                                         : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                       } ${role.id === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                     >
                                       {perms[action] ? <Check size={16} strokeWidth={3} /> : <Ban size={14} className="opacity-50" />}
                                     </button>
                                   </td>
                                 ))}
                               </tr>
                             );
                          })}
                        </tbody>
                      </table>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg">{editingUser ? 'Edit User' : 'New Shore Login'}</h3>
                 <button onClick={() => setIsUserModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground">First Name</label><input name="firstName" required defaultValue={editingUser?.firstName} className="input-field w-full" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground">Last Name</label><input name="lastName" required defaultValue={editingUser?.lastName} className="input-field w-full" /></div>
                 </div>
                 <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground">Email</label><input type="email" name="email" required defaultValue={editingUser?.email} className="input-field w-full" /></div>
                 <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground">Role</label><select name="roleId" required defaultValue={editingUser?.roleId} className="input-field w-full"><option value="">Select Role...</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                 <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground">Phone</label><input name="phone" defaultValue={editingUser?.phone} className="input-field w-full" /></div>
                 <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground">Status</label><select name="status" defaultValue={editingUser?.status || 'Active'} className="input-field w-full"><option>Active</option><option>Inactive</option></select></div>
                 <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary flex items-center gap-2"><Save size={16} /> Save</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;