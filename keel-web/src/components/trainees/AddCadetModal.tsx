// keel-web/src/components/trainees/AddCadetModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Globe, Book, Briefcase } from 'lucide-react';
import { Country, State, City }  from 'country-state-city';
import { BLOOD_GROUPS, RELATIONSHIPS, TRAINEE_TYPES, toProperCase, toSentenceCase } from '../../constants/cadetData';

interface AddCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any; 
}

const AddCadetModal: React.FC<AddCadetModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');

  // Form State
  const [formData, setFormData] = useState<any>({
    country: '', state: '', city: '',
    trbApplicable: true
  });

  // Effect to populate data on open
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // --- 1. SMART RESOLVE COUNTRY & STATE ---
        // Fix: If backend returns "India", we need to find "IN" for the dropdown to work.
        const allCountries = Country.getAllCountries();
        const rawCountry = initialData.country || '';
        
        let countryCode = '';
        const resolvedCountry = allCountries.find(c => 
          c.isoCode === rawCountry || c.name.toLowerCase() === rawCountry.toLowerCase()
        );
        if (resolvedCountry) countryCode = resolvedCountry.isoCode;

        // Resolve State based on the found Country
        let stateCode = '';
        if (countryCode && initialData.state) {
           const allStates = State.getStatesOfCountry(countryCode);
           const rawState = initialData.state;
           const resolvedState = allStates.find(s => 
             s.isoCode === rawState || s.name.toLowerCase() === rawState.toLowerCase()
           );
           if (resolvedState) stateCode = resolvedState.isoCode;
        }

        // --- 2. MAP BACKEND DATA TO FORM ---
        setFormData({
          ...initialData,
          // Basic & Personal
          fullName: initialData.name || `${initialData.first_name || ''} ${initialData.last_name || ''}`.trim(),
          email: initialData.email,
          mobile: initialData.phone, 
          dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
          gender: initialData.gender,
          bloodGroup: initialData.blood_group,

          // Address (Use Resolved ISO Codes)
          address: initialData.address,
          country: countryCode, 
          state: stateCode,
          city: initialData.city,
          pincode: initialData.pincode,

          // Emergency
          kinName: initialData.kin_name,
          kinRelation: initialData.kin_relation,
          kinMobile: initialData.kin_mobile,
          kinEmail: initialData.kin_email,

          // Passport
          passportNo: initialData.passport_number,
          nationality: initialData.nationality,
          passportIssueDate: initialData.passport_issue_date ? new Date(initialData.passport_issue_date).toISOString().split('T')[0] : '',
          passportExpiryDate: initialData.passport_expiry_date ? new Date(initialData.passport_expiry_date).toISOString().split('T')[0] : '',
          passportPlace: initialData.passport_place,

          // CDC
          cdcNo: initialData.cdc_number,
          cdcCountry: initialData.cdc_country,
          cdcIssueDate: initialData.cdc_issue_date ? new Date(initialData.cdc_issue_date).toISOString().split('T')[0] : '',
          cdcExpiryDate: initialData.cdc_expiry_date ? new Date(initialData.cdc_expiry_date).toISOString().split('T')[0] : '',
          indosNo: initialData.indos_number,
          sidNo: initialData.sid_number,

          // Roles
          traineeType: initialData.rank,
          doj: initialData.sign_on_date ? new Date(initialData.sign_on_date).toISOString().split('T')[0] : '',
        });
        
        // Sync Dropdowns with resolved codes
        setSelectedCountry(countryCode);
        setSelectedState(stateCode);

      } else {
        // Add Mode: Reset form
        setFormData({
          country: '', state: '', city: '',
          trbApplicable: true
        });
        setSelectedCountry('');
        setSelectedState('');
        setActiveTab('personal');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        return;
    }
    let finalValue = value;
    if (name === 'fullName') finalValue = toProperCase(value);
    if (name === 'address') finalValue = toSentenceCase(value);

    setFormData({ ...formData, [name]: finalValue });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    setFormData({ ...formData, country: countryCode, state: '', city: '' });
    setSelectedState('');
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value;
    setSelectedState(stateCode);
    setFormData({ ...formData, state: stateCode, city: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse Full Name back into First/Last for the backend
    const nameParts = (formData.fullName || '').trim().split(/\s+/);
    const payload = {
        ...formData,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
        rank: formData.traineeType,
        phone: formData.mobile,
        indos_number: formData.indosNo,
        
        // Explicit mapping to DB columns
        blood_group: formData.bloodGroup,
        kin_name: formData.kinName,
        kin_relation: formData.kinRelation,
        kin_mobile: formData.kinMobile,
        kin_email: formData.kinEmail,
        passport_number: formData.passportNo,
        passport_issue_date: formData.passportIssueDate,
        passport_expiry_date: formData.passportExpiryDate,
        passport_place: formData.passportPlace,
        cdc_number: formData.cdcNo,
        cdc_country: formData.cdcCountry,
        cdc_issue_date: formData.cdcIssueDate,
        cdc_expiry_date: formData.cdcExpiryDate,
        sid_number: formData.sidNo,
        sign_on_date: formData.doj
    };

    onSave(payload);
    onClose();
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: <User size={16} /> },
    { id: 'emergency', label: 'Emergency', icon: <Phone size={16} /> },
    { id: 'passport', label: 'Passport', icon: <Globe size={16} /> },
    { id: 'seaman', label: 'CDC / Book', icon: <Book size={16} /> },
    { id: 'roles', label: 'Roles', icon: <Briefcase size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">
            {initialData ? 'Edit Cadet Profile' : 'Register New Cadet'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-border bg-muted/30 px-4 pt-2 space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id 
                ? 'bg-card text-primary border-t border-x border-border -mb-px shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* FORM CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="cadetForm" onSubmit={handleSubmit} className="space-y-6">

            {/* A) PERSONAL DETAILS */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="md:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Full Name (Proper Case)</label>
                  <input name="fullName" required value={formData.fullName || ''} onChange={handleChange} className="input-field" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date of Birth</label>
                  <input name="dob" type="date" value={formData.dob || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Gender</label>
                    <select name="gender" value={formData.gender || ''} onChange={handleChange} className="input-field">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Home Address</label>
                  <input name="address" value={formData.address || ''} onChange={handleChange} className="input-field" placeholder="Flat/House No, Street, Landmark" />
                </div>

                {/* LOCATION DROPDOWNS */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Country</label>
                  <select name="country" value={selectedCountry} onChange={handleCountryChange} className="input-field">
                    <option value="">Select Country</option>
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">State</label>
                  <select name="state" value={selectedState} onChange={handleStateChange} disabled={!selectedCountry} className="input-field disabled:opacity-50">
                    <option value="">Select State</option>
                    {State.getStatesOfCountry(selectedCountry).map((s) => (
                      <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">City</label>
                  <select name="city" value={formData.city || ''} onChange={handleChange} disabled={!selectedState} className="input-field disabled:opacity-50">
                    <option value="">Select City</option>
                    {City.getCitiesOfState(selectedCountry, selectedState).map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Pin Code</label>
                  <input name="pincode" value={formData.pincode || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Email ID</label>
                  <input name="email" type="email" required value={formData.email || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Mobile Number</label>
                  <input name="mobile" type="tel" value={formData.mobile || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="input-field">
                    <option value="">Select...</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* B) EMERGENCY CONTACT */}
            {activeTab === 'emergency' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Name of Contact</label>
                  <input name="kinName" value={formData.kinName || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Relation</label>
                  <select name="kinRelation" value={formData.kinRelation || ''} onChange={handleChange} className="input-field">
                    <option value="">Select...</option>
                    {RELATIONSHIPS.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Contact Number</label>
                  <input name="kinMobile" type="tel" value={formData.kinMobile || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Email ID (Optional)</label>
                  <input name="kinEmail" type="email" value={formData.kinEmail || ''} onChange={handleChange} className="input-field" />
                </div>
              </div>
            )}

            {/* C) PASSPORT DETAILS */}
            {activeTab === 'passport' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Passport Number</label>
                  <input name="passportNo" value={formData.passportNo || ''} onChange={handleChange} className="input-field uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Nationality</label>
                  <select name="nationality" required value={formData.nationality || ''} onChange={handleChange} className="input-field">
                    <option value="">Select...</option>
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date of Issue</label>
                  <input name="passportIssueDate" type="date" value={formData.passportIssueDate || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date of Expiry</label>
                  <input name="passportExpiryDate" type="date" value={formData.passportExpiryDate || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Place of Issue</label>
                  <input name="passportPlace" value={formData.passportPlace || ''} onChange={handleChange} className="input-field" />
                </div>
              </div>
            )}

            {/* D) SEAMAN BOOK (CDC) */}
            {activeTab === 'seaman' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Seaman Book (CDC) No.</label>
                  <input name="cdcNo" value={formData.cdcNo || ''} onChange={handleChange} className="input-field uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Country of Issue</label>
                  <select name="cdcCountry" value={formData.cdcCountry || ''} onChange={handleChange} className="input-field">
                    <option value="">Select...</option>
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date of Issue</label>
                  <input name="cdcIssueDate" type="date" value={formData.cdcIssueDate || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date of Expiry</label>
                  <input name="cdcExpiryDate" type="date" value={formData.cdcExpiryDate || ''} onChange={handleChange} className="input-field" />
                </div>
                
                <div className="col-span-2 border-t border-border my-2"></div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">INDoS Number (Indian Nationals)</label>
                  <input name="indosNo" value={formData.indosNo || ''} onChange={handleChange} className="input-field uppercase" placeholder="Mandatory for Indian Flag" />
                </div>
                 <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Seaman ID / SID (Optional)</label>
                  <input name="sidNo" value={formData.sidNo || ''} onChange={handleChange} className="input-field" />
                </div>
              </div>
            )}

            {/* E) ROLES */}
            {activeTab === 'roles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Type of Trainee</label>
                  <select name="traineeType" required value={formData.traineeType || ''} onChange={handleChange} className="input-field">
                    <option value="">Select...</option>
                    {TRAINEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                 <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Date of Joining Company</label>
                  <input name="doj" type="date" value={formData.doj || ''} onChange={handleChange} className="input-field" />
                </div>
                <div className="col-span-2 pt-4">
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <input 
                      type="checkbox" 
                      name="trbApplicable" 
                      checked={formData.trbApplicable || false} 
                      onChange={handleChange} 
                      className="w-5 h-5 accent-primary" 
                    />
                    <div>
                        <p className="text-sm font-bold text-foreground">TRB Applicable</p>
                        <p className="text-xs text-muted-foreground">Enable digital Training Record Book for this user.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex justify-end space-x-3 bg-card rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button form="cadetForm" type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-sm">
            <Save size={16} />
            <span>{initialData ? 'Update Profile' : 'Create Cadet Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCadetModal;