import React, { useState } from 'react';
import { Database, Plus, Trash2, Tag, Anchor, Users } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ConstantsPage
 * Allows Super Admin to manage global dropdown lists.
 */
const ConstantsPage: React.FC = () => {
  // MOCK DATA (In real app, fetch from API)
  const [ranks, setRanks] = useState(['Captain', 'Chief Officer', '2nd Officer', '3rd Officer', 'Chief Engineer', '2nd Engineer']);
  const [shipTypes, setShipTypes] = useState(['Bulk Carrier', 'Oil Tanker', 'Container Ship', 'LNG Carrier', 'LPG Carrier', 'Ro-Ro']);
  const [departments, setDepartments] = useState(['Deck', 'Engine', 'Electrical', 'Galley']);

  const [activeTab, setActiveTab] = useState<'ranks' | 'ships' | 'depts'>('ranks');
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    if (activeTab === 'ranks') setRanks([...ranks, newItem]);
    if (activeTab === 'ships') setShipTypes([...shipTypes, newItem]);
    if (activeTab === 'depts') setDepartments([...departments, newItem]);
    setNewItem('');
    toast.success('Item added to list');
  };

  const handleDelete = (item: string, listType: string) => {
    if (!confirm(`Delete "${item}"?`)) return;
    if (listType === 'ranks') setRanks(ranks.filter(r => r !== item));
    if (listType === 'ships') setShipTypes(shipTypes.filter(s => s !== item));
    if (listType === 'depts') setDepartments(departments.filter(d => d !== item));
    toast.success('Item removed');
  };

  const ListEditor = ({ title, icon, data, type }: any) => (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <div className="p-4 flex gap-2 border-b border-border">
        <input 
          className="flex-1 bg-background border border-input px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary"
          placeholder={`Add new ${title.toLowerCase().slice(0, -1)}...`}
          value={activeTab === type ? newItem : ''}
          onChange={(e) => { setActiveTab(type); setNewItem(e.target.value); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={() => { setActiveTab(type); handleAdd(); }} className="bg-primary text-white p-2 rounded-md hover:bg-primary/90">
          <Plus size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {data.map((item: string) => (
          <div key={item} className="flex justify-between items-center p-3 rounded-md hover:bg-muted group">
            <span className="text-sm font-medium text-foreground">{item}</span>
            <button 
              onClick={() => handleDelete(item, type)}
              className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Constants</h1>
        <p className="text-muted-foreground text-sm">Manage global definitions used across all tenants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <ListEditor title="Rank List" icon={<Users size={18} className="text-blue-500"/>} data={ranks} type="ranks" />
        <ListEditor title="Ship Types" icon={<Anchor size={18} className="text-teal-500"/>} data={shipTypes} type="ships" />
        <ListEditor title="Departments" icon={<Tag size={18} className="text-purple-500"/>} data={departments} type="depts" />
      </div>
    </div>
  );
};

export default ConstantsPage;