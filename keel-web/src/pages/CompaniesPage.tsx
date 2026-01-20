import React, { useEffect, useState } from 'react';
import { 
  Building, Plus, Search, MoreVertical, Edit, 
  Trash2, Globe, Users, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { getCompanies, createCompany, deleteCompany, updateCompany } from '../services/companyService';

interface Company {
  id: number;
  name: string;
  domain: string;
  plan_tier: string;
  contact_email: string;
  user_count: number;
  is_active: boolean;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    plan_tier: 'TRIAL',
    contact_email: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      toast.error("Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
        toast.success("Company updated successfully");
      } else {
        await createCompany(formData);
        toast.success("Company created successfully");
      }
      setShowModal(false);
      setEditingCompany(null);
      setFormData({ name: '', domain: '', plan_tier: 'TRIAL', contact_email: '' });
      loadCompanies();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure? This will disable access for all users in this company.")) return;
    try {
      await deleteCompany(id);
      toast.success("Company deleted");
      loadCompanies();
    } catch (err) {
      toast.error("Could not delete company");
    }
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      domain: company.domain,
      plan_tier: company.plan_tier,
      contact_email: company.contact_email
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage tenant access and subscriptions.</p>
        </div>
        <button 
          onClick={() => { setEditingCompany(null); setShowModal(true); }}
          className="bg-primary text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-primary/90 transition"
        >
          <Plus size={18} />
          <span>Add Company</span>
        </button>
      </div>

      {/* LIST */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              className="pl-9 w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" 
              placeholder="Search companies..." 
            />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Users</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-border hover:bg-muted/30 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                      <Building size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{company.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe size={10} /> {company.domain || 'No domain'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    company.plan_tier === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700' : 
                    company.plan_tier === 'STANDARD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {company.plan_tier}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users size={14} />
                    <span>{company.user_count}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {company.is_active ? (
                    <div className="flex items-center text-green-600 text-xs font-medium">
                      <ShieldCheck size={14} className="mr-1" /> Active
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 text-xs font-medium">
                      <AlertCircle size={14} className="mr-1" /> Suspended
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(company)} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(company.id)} className="p-2 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-lg shadow-lg border border-border p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold mb-4">{editingCompany ? 'Edit Company' : 'New Company'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">Company Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">Domain (Auto-Assign)</label>
                <input 
                  value={formData.domain}
                  placeholder="e.g. maersk.com"
                  onChange={e => setFormData({...formData, domain: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">Subscription Tier</label>
                <select 
                  value={formData.plan_tier}
                  onChange={e => setFormData({...formData, plan_tier: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="TRIAL">Trial</option>
                  <option value="STANDARD">Standard</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}