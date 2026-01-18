// keel-web/src/components/trainees/ImportCadetModal.tsx

import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle, ChevronLeft, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Country } from 'country-state-city';
import { BLOOD_GROUPS, RELATIONSHIPS, TRAINEE_TYPES } from '../../constants/cadetData';

interface ImportCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const ImportCadetModal: React.FC<ImportCadetModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  if (!isOpen) return null;

  // ---------------------------------------------------------
  // 1. GENERATE SMART TEMPLATE (FULL PARITY – NO UI CHANGE)
  // ---------------------------------------------------------
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cadets');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Gender', key: 'gender', width: 12 },

      { header: 'Address', key: 'address', width: 30 },
      { header: 'Country (ISO)', key: 'country', width: 15 },
      { header: 'State (ISO)', key: 'state', width: 15 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'Pin Code', key: 'pincode', width: 12 },

      { header: 'Email', key: 'email', width: 25 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Blood Group', key: 'bloodGroup', width: 15 },

      { header: 'Emergency Contact Name', key: 'kinName', width: 25 },
      { header: 'Relation', key: 'kinRelation', width: 15 },
      { header: 'Emergency Mobile', key: 'kinMobile', width: 15 },
      { header: 'Emergency Email', key: 'kinEmail', width: 25 },

      { header: 'Passport No', key: 'passportNo', width: 18 },
      { header: 'Nationality', key: 'nationality', width: 20 },
      { header: 'Passport Issue Date', key: 'passportIssueDate', width: 18 },
      { header: 'Passport Expiry Date', key: 'passportExpiryDate', width: 18 },
      { header: 'Passport Place', key: 'passportPlace', width: 20 },

      { header: 'CDC No', key: 'cdcNo', width: 18 },
      { header: 'CDC Country', key: 'cdcCountry', width: 20 },
      { header: 'CDC Issue Date', key: 'cdcIssueDate', width: 18 },
      { header: 'CDC Expiry Date', key: 'cdcExpiryDate', width: 18 },

      { header: 'INDoS No', key: 'indosNo', width: 18 },
      { header: 'SID No', key: 'sidNo', width: 18 },

      { header: 'Trainee Type', key: 'traineeType', width: 20 },
      { header: 'Date of Joining', key: 'doj', width: 18 },
      { header: 'TRB Applicable (YES / NO)', key: 'trbApplicable', width: 22 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3194A0' } };

    const refSheet = workbook.addWorksheet('RefData');
    refSheet.state = 'hidden';

    const countries = Country.getAllCountries().map(c => c.name);
    countries.forEach((c, i) => refSheet.getCell(`A${i + 1}`).value = c);
    BLOOD_GROUPS.forEach((b, i) => refSheet.getCell(`B${i + 1}`).value = b);
    RELATIONSHIPS.forEach((r, i) => refSheet.getCell(`C${i + 1}`).value = r);
    TRAINEE_TYPES.forEach((t, i) => refSheet.getCell(`D${i + 1}`).value = t);
    ['YES', 'NO'].forEach((v, i) => refSheet.getCell(`E${i + 1}`).value = v);

    for (let i = 2; i <= 500; i++) {
      worksheet.getCell(`C${i}`).dataValidation = { type: 'list', formulae: ['"Male,Female,Other"'] };
      worksheet.getCell(`L${i}`).dataValidation = { type: 'list', formulae: [`RefData!$B$1:$B$${BLOOD_GROUPS.length}`] };
      worksheet.getCell(`N${i}`).dataValidation = { type: 'list', formulae: [`RefData!$C$1:$C$${RELATIONSHIPS.length}`] };
      worksheet.getCell(`R${i}`).dataValidation = { type: 'list', formulae: [`RefData!$A$1:$A$${countries.length}`] };
      worksheet.getCell(`AA${i}`).dataValidation = { type: 'list', formulae: [`RefData!$D$1:$D$${TRAINEE_TYPES.length}`] };
      worksheet.getCell(`AC${i}`).dataValidation = { type: 'list', formulae: ['RefData!$E$1:$E$2'] };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'keel_cadet_import_template.xlsx');
    toast.success('Enhanced Smart Template downloaded.');
  };

  // ---------------------------------------------------------
  // 2. HELPER: FUZZY HEADER MATCHER (UNCHANGED)
  // ---------------------------------------------------------
  const getValue = (row: any, targetKeys: string[]) => {
    const normalize = (k: string) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rowKeys = Object.keys(row);
    for (const target of targetKeys) {
      const foundKey = rowKeys.find(k => normalize(k) === normalize(target));
      if (foundKey) return row[foundKey];
    }
    return null;
  };

  // ---------------------------------------------------------
  // 3. FILE PARSING (FULL DATA – SAME UI)
  // ---------------------------------------------------------
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(data), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);

      if (json.length === 0) {
        toast.error("File is empty.");
        setIsProcessing(false);
        return;
      }

      const mappedData = json.map((row: any) => ({
        fullName: getValue(row, ['Full Name', 'fullName']),
        dob: getValue(row, ['Date of Birth', 'dob']),
        gender: getValue(row, ['Gender']),
        address: getValue(row, ['Address']),
        country: getValue(row, ['Country']),
        state: getValue(row, ['State']),
        city: getValue(row, ['City']),
        pincode: getValue(row, ['Pin Code']),
        email: getValue(row, ['Email']),
        mobile: getValue(row, ['Mobile']),
        bloodGroup: getValue(row, ['Blood Group']),
        kinName: getValue(row, ['Emergency Contact Name']),
        kinRelation: getValue(row, ['Relation']),
        kinMobile: getValue(row, ['Emergency Mobile']),
        kinEmail: getValue(row, ['Emergency Email']),
        passportNo: getValue(row, ['Passport No']),
        nationality: getValue(row, ['Nationality']),
        passportIssueDate: getValue(row, ['Passport Issue Date']),
        passportExpiryDate: getValue(row, ['Passport Expiry Date']),
        passportPlace: getValue(row, ['Passport Place']),
        cdcNo: getValue(row, ['CDC No']),
        cdcCountry: getValue(row, ['CDC Country']),
        cdcIssueDate: getValue(row, ['CDC Issue Date']),
        cdcExpiryDate: getValue(row, ['CDC Expiry Date']),
        indosNo: getValue(row, ['INDoS No']),
        sidNo: getValue(row, ['SID No']),
        traineeType: getValue(row, ['Trainee Type']),
        doj: getValue(row, ['Date of Joining']),
        trbApplicable: String(getValue(row, ['TRB Applicable']) || '').toUpperCase() === 'YES',
      }));

      const cleanData = mappedData.filter(d => d.email);
      if (!cleanData.length) {
        toast.error("No valid trainee data found (Email is required).");
        setIsProcessing(false);
        return;
      }

      setPreviewData(cleanData);
    } catch (e) {
      toast.error("Failed to parse Excel file");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (previewData && previewData.length > 0) {
      onImport(previewData);
      onClose();
      setPreviewData(null); 
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
       <div className={`bg-card dark:bg-zinc-900 w-full ${previewData ? 'max-w-5xl' : 'max-w-lg'} rounded-xl border border-border shadow-2xl transition-all`}>
          
          <div className="flex items-center justify-between p-4 border-b border-border">
             <div className="flex items-center space-x-2 text-foreground">
                <FileSpreadsheet size={20} className="text-teal-600" />
                <h2 className="font-bold text-lg">Import Trainees</h2>
             </div>
             <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground"/></button>
          </div>
          
          {!previewData ? (
             <div className="p-6 space-y-6">
                 <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm">
                       <p className="font-bold text-foreground">Full Field Support</p>
                       <p className="text-muted-foreground mt-1">
                          This template now includes columns for <b>Password</b>, <b>Mobile</b>, <b>Passport</b>, <b>CDC</b>, and <b>TRB</b>.
                       </p>
                    </div>
                 </div>

                 <div 
                   className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                     dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40'
                   }`}
                   onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                   onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={handleDrop}
                   onClick={() => fileInputRef.current?.click()}
                 >
                    <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                    <Upload size={40} className="text-primary mb-3"/>
                    <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">XLSX files only</p>
                 </div>

                 <div className="flex justify-start">
                    <button onClick={downloadTemplate} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                       <Download size={14}/> Download Updated Smart Template
                    </button>
                 </div>
             </div>
          ) : (
             <div className="flex flex-col h-125">
                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                   <div>
                      <h3 className="font-bold text-foreground">Preview {previewData.length} Trainees</h3>
                      <p className="text-xs text-muted-foreground">Confirm data accuracy before finalizing the import.</p>
                   </div>
                   <button onClick={() => setPreviewData(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <ChevronLeft size={14} /> Re-upload
                   </button>
                </div>

                <div className="flex-1 overflow-auto">
                   <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-muted sticky top-0 z-10">
                         <tr>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Name</th>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Email</th>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">INDoS</th>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Rank</th>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Nationality</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                         {previewData.map((t, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                               <td className="p-3 font-bold text-foreground">{t.fullName}</td>
                               <td className="p-3 text-muted-foreground">{t.email}</td>
                               <td className="p-3 text-muted-foreground font-mono">{t.indosNo}</td>
                               <td className="p-3 text-muted-foreground">{t.traineeType}</td>
                               <td className="p-3 text-muted-foreground">{t.nationality}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="p-4 border-t border-border bg-card rounded-b-xl flex justify-end gap-3">
                   <button onClick={() => setPreviewData(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                   <button onClick={handleConfirmImport} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} /> Confirm Bulk Import
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default ImportCadetModal;
