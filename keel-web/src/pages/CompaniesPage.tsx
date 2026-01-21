//keel-web/src/pages/CompaniesPage.tsx

import React, { useEffect, useState } from 'react';
import { 
  Building, Plus, Search, Edit, Trash2, Globe, Users, 
  ShieldCheck, AlertCircle, Calendar, CreditCard, CheckCircle2,
  Power, Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { getCompanies, createCompany, deleteCompany, updateCompany } from '../services/companyService';

interface Company {
  id: number;
  name: string;
  domain: string;
  contact_email: string;
  user_count: number;
  is_active: boolean;
  // Flatted Subscription Props
  subscription_status?: string;
  valid_until?: string;
  cadet_limit?: number;
  price_per_cadet?: number; // Added to interface
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // --- FORM STATE ---
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contact_email: '',
    address: '',
    cadet_limit: 10,
    price_per_cadet: 500,
    valid_until: nextYear.toISOString().split('T')[0],
    is_active: true
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
        toast.success("Company & License updated successfully");
      } else {
        await createCompany(formData);
        toast.success("New Tenant Provisioned Successfully");
      }
      setShowModal(false);
      resetForm();
      loadCompanies();
    } catch (err: any) {
      console.error("Company Operation Error:", err);
      toast.error(err.message || "Operation failed. Please check inputs.");
    }
  };

  // --- ACTIONS ---

  const handleToggleStatus = async (company: Company) => {
    const newStatus = !company.is_active;
    const action = newStatus ? "Activate" : "Suspend";
    
    if(!confirm(`Are you sure you want to ${action} access for ${company.name}?`)) return;

    try {
      await updateCompany(company.id, { is_active: newStatus });
      toast.success(`Company ${action}d`);
      loadCompanies(); 
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} company`);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("⚠️ CRITICAL: This is a PERMANENT DELETE. All data for this company will be lost. To just block access, use the 'Suspend' button instead.\n\nAre you sure you want to proceed?")) return;
    try {
      await deleteCompany(id);
      toast.success("Company deleted permanently");
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
      contact_email: company.contact_email,
      address: '',
      cadet_limit: company.cadet_limit || 10,
      price_per_cadet: company.price_per_cadet || 500, // Now correctly loads existing price
      valid_until: company.valid_until ? new Date(company.valid_until).toISOString().split('T')[0] : '',
      is_active: company.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCompany(null);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    setFormData({
      name: '',
      domain: '',
      contact_email: '',
      address: '',
      cadet_limit: 10,
      price_per_cadet: 500,
      valid_until: nextYear.toISOString().split('T')[0],
      is_active: true
    });
  };

  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return 0;
    const end = new Date(dateStr);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24)); 
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Companies & Licensing</h1>
          <p className="text-muted-foreground">Provision new tenants and manage subscription limits.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-all active:scale-95"
        >
          <Plus size={18} />
          <span className="font-medium">Provision New Company</span>
        </button>
      </div>

      {/* LIST */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              className="pl-9 w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
              placeholder="Search by name or domain..." 
            />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
            <tr>
              <th className="px-6 py-3">Tenant</th>
              <th className="px-6 py-3">Seats (Licenses)</th>
              <th className="px-6 py-3">Subscription Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => {
              const daysLeft = getDaysRemaining(company.valid_until);
              const isExpiringSoon = daysLeft < 30 && daysLeft > 0;
              const isExpired = daysLeft <= 0;

              return (
                <tr key={company.id} className="border-b border-border hover:bg-muted/30 transition group">
                  {/* Tenant Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Building size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{company.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe size={10} /> {company.domain || 'No domain'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Seat Usage */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                         <span>{company.user_count} used</span>
                         <span className="text-muted-foreground">of {company.cadet_limit}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                           className={`h-full rounded-full ${company.user_count >= (company.cadet_limit || 0) ? 'bg-red-500' : 'bg-green-500'}`} 
                           style={{ width: `${Math.min(((company.user_count / (company.cadet_limit || 1)) * 100), 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* License Status */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                       {company.is_active ? (
                          isExpired ? (
                             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <AlertCircle size={12}/> EXPIRED
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle2 size={12}/> ACTIVE
                             </span>
                          )
                       ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                             <Ban size={12} /> SUSPENDED
                          </span>
                       )}
                       
                       <div className={`text-xs ${isExpiringSoon ? 'text-orange-600 font-bold' : 'text-muted-foreground'}`}>
                          {company.valid_until ? `Valid until: ${new Date(company.valid_until).toLocaleDateString()}` : 'No Expiry'}
                       </div>
                    </div>
                  </td>

                  {/* HOVER ACTIONS - EDIT / STATUS / DELETE */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      
                      {/* 1. EDIT BUTTON */}
                      <button 
                        onClick={() => openEdit(company)} 
                        className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors" 
                        title="Edit Details"
                      >
                        <Edit size={16} />
                      </button>

                      {/* 2. CHANGE STATUS BUTTON */}
                      <button 
                        onClick={() => handleToggleStatus(company)}
                        className={`p-2 rounded-lg transition-colors ${
                          company.is_active 
                            ? 'hover:bg-orange-50 text-muted-foreground hover:text-orange-600' 
                            : 'hover:bg-green-50 text-green-600 hover:text-green-700'
                        }`}
                        title={company.is_active ? "Suspend Access" : "Activate Access"}
                      >
                        {company.is_active ? <Ban size={16} /> : <Power size={16} />}
                      </button>

                      {/* 3. DELETE BUTTON */}
                      <button 
                        onClick={() => handleDelete(company.id)} 
                        className="p-2 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 transition-colors" 
                        title="Delete Company Permanently"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODERN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
               <div>
                  <h2 className="text-lg font-bold text-foreground">{editingCompany ? 'Edit Client Account' : 'Provision New Client'}</h2>
                  <p className="text-xs text-muted-foreground">Configure company details and license limits.</p>
               </div>
               <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* LEFT: COMPANY DETAILS */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                      <Building size={16}/> Company Details
                   </div>
                   
                   <div>
                      <label className="text-xs font-medium text-muted-foreground">Company Name</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full mt-1.5 px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="e.g. Maersk Line"
                      />
                   </div>
                   
                   <div>
                      <label className="text-xs font-medium text-muted-foreground">Domain (Auto-Assign)</label>
                      <div className="relative">
                        <Globe size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <input 
                           value={formData.domain}
                           onChange={e => setFormData({...formData, domain: e.target.value})}
                           className="w-full mt-1.5 pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                           placeholder="e.g. maersk.com"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Used to auto-detect company during login.</p>
                   </div>
                   
                   <div>
                      <label className="text-xs font-medium text-muted-foreground">Primary Contact Email</label>
                      <input 
                        type="email"
                        value={formData.contact_email}
                        onChange={e => setFormData({...formData, contact_email: e.target.value})}
                        className="w-full mt-1.5 px-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="admin@company.com"
                      />
                   </div>

                   <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={formData.is_active}
                           onChange={e => setFormData({...formData, is_active: e.target.checked})}
                           className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                         />
                         <span className="text-sm font-medium">Account is Active</span>
                      </label>
                   </div>
                </div>

                {/* RIGHT: LICENSING */}
                <div className="space-y-4 md:border-l md:pl-8 border-border">
                   <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-2">
                      <CreditCard size={16}/> Licensing & Billing
                   </div>

                   <div>
                      <label className="text-xs font-medium text-muted-foreground">License Limit (Seats)</label>
                      <div className="relative">
                        <Users size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <input 
                           type="number"
                           min="1"
                           value={formData.cadet_limit}
                           onChange={e => setFormData({...formData, cadet_limit: Number(e.target.value)})}
                           className="w-full mt-1.5 pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                   </div>

                   {/* --- ENABLED PRICE FIELD --- */}
                   <div>
                      <label className="text-xs font-medium text-muted-foreground">Price Per Cadet (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground font-bold">$</span>
                        <input 
                           type="number"
                           value={formData.price_per_cadet}
                           onChange={e => setFormData({...formData, price_per_cadet: Number(e.target.value)})}
                           className="w-full mt-1.5 pl-8 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Default rate: $500/cadet (One-time)</p>
                   </div>

                   <div>
                      <label className="text-xs font-medium text-muted-foreground">License Valid Until</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-3 text-muted-foreground" />
                        <input 
                           type="date"
                           required
                           value={formData.valid_until}
                           onChange={e => setFormData({...formData, valid_until: e.target.value})}
                           className="w-full mt-1.5 pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">System allows +15 days grace period automatically.</p>
                   </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                >
                  {editingCompany ? 'Save Changes' : 'Provision Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}