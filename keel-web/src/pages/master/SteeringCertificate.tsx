import React from 'react';
import { Anchor, ShieldCheck } from 'lucide-react';
import { getSettings } from '../../services/dataService';

interface SteeringCertificateProps {
  traineeName: string;
  rank: string;
  indos: string;
  vesselName: string;
  completionDate: string;
  hoursSteered: number;
}

const SteeringCertificate: React.FC<SteeringCertificateProps> = ({
  traineeName,
  rank,
  indos,
  vesselName,
  completionDate,
  hoursSteered
}) => {
  const settings = getSettings();
  const company = settings?.general || {};
  const BRAND_COLOR = '#3194A0';

  return (
    <div className="bg-white text-slate-900 p-12 border-[12px] border-double shadow-2xl mx-auto w-[210mm] min-h-[297mm]" 
         style={{ borderColor: BRAND_COLOR }}>
      
      {/* 1. DOCUMENT HEADER */}
      <div className="flex justify-between items-start border-b-2 pb-8 mb-12" style={{ borderColor: BRAND_COLOR }}>
        <div className="flex gap-4 items-center">
          {company.logo ? (
            <img src={company.logo} alt="Company Logo" className="h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded">
              <Anchor size={32} className="text-slate-400" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: BRAND_COLOR }}>
              {company.orgName || 'MARITIME SHIPPING CORP'}
            </h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold w-64 leading-tight">
              {company.address}, {company.city}, {company.country} - {company.pincode}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Ref:</div>
          <div className="font-mono text-sm font-bold">CERT/STR/{new Date().getFullYear()}/{indos}</div>
        </div>
      </div>

      {/* 2. CERTIFICATE TITLE */}
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl font-black uppercase tracking-widest text-slate-800">
          Certificate of Steering
        </h1>
        <div className="h-1 w-24 bg-slate-200 mx-auto rounded-full"></div>
        <p className="text-sm italic text-slate-500">
          Issued in accordance with the International Convention on Standards of Training, Certification and Watchkeeping for Seafarers (STCW).
        </p>
      </div>

      {/* 3. CORE CONTENT */}
      <div className="space-y-10 text-center px-12">
        <p className="text-lg">This is to certify that</p>
        
        <div>
          <h2 className="text-3xl font-serif font-bold border-b-2 border-slate-100 inline-block px-8 pb-1 mb-1 italic">
            {traineeName}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Full Name of Trainee / {rank}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-left max-w-lg mx-auto py-8 bg-slate-50 rounded-2xl p-8 border border-slate-100">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase">INDOS Number</label>
            <p className="font-bold">{indos}</p>
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase">Vessel Name</label>
            <p className="font-bold uppercase">{vesselName}</p>
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase">Training Completed</label>
            <p className="font-bold">{completionDate}</p>
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase">Certified Steering Hours</label>
            <p className="font-bold">{hoursSteered} Hours</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">
          Has performed the duties of a steersman and has demonstrated proficiency in 
          manual steering under the supervision of qualified officers for the duration 
          specified above in various sea and weather conditions.
        </p>
      </div>

      {/* 4. SIGNATURE SECTION */}
      <div className="mt-24 grid grid-cols-2 gap-20 px-12">
        <div className="text-center border-t border-slate-300 pt-4">
          <div className="h-12 flex items-center justify-center italic text-[#3194A0] font-serif">
            Verified Digital Record
          </div>
          <p className="font-bold text-xs uppercase">Technical Officer / CTO</p>
        </div>
        <div className="text-center border-t border-slate-300 pt-4 relative">
          <ShieldCheck className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-10 text-[#3194A0]" size={80} />
          <div className="h-12 flex items-center justify-center">
             {/* Signature Placeholder */}
          </div>
          <p className="font-bold text-xs uppercase">Master of the Vessel</p>
        </div>
      </div>

      {/* 5. FOOTER */}
      <div className="mt-20 text-center">
        <div className="inline-block p-4 border-2 border-slate-100 rounded-xl">
           {/* QR Code Placeholder for digital verification */}
           <div className="w-16 h-16 bg-slate-50 border border-slate-200 flex items-center justify-center text-[8px] text-slate-300">
              SECURE QR
           </div>
        </div>
        <p className="text-[9px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
          Authenticity can be verified via the Keel Digital Training Record System.
        </p>
      </div>
    </div>
  );
};

export default SteeringCertificate;