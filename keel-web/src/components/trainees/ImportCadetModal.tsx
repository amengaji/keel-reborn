// keel-web/src/components/trainees/ImportCadetModal.tsx

import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle, ChevronLeft, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Country } from 'country-state-city';
import { BLOOD_GROUPS, RELATIONSHIPS, TRAINEE_TYPES } from '../../constants/cadetData';
import { importCadetsBulk, ImportSummary } from '../../services/importService';

interface ImportCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

const ImportCadetModal: React.FC<ImportCadetModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  if (!isOpen) return null;

  // --- HELPER: FORMAT DATE ---
  const formatDate = (val: any) => {
    if (!val) return '';
    if (val instanceof Date) return val.toISOString().split('T')[0];
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const getValue = (row: any, targetKeys: string[]) => {
    const normalize = (k: string) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rowKeys = Object.keys(row);
    for (const target of targetKeys) {
      const foundKey = rowKeys.find(k => normalize(k) === normalize(target));
      if (foundKey) return row[foundKey];
    }
    return null;
  };

  // --- 1. DOWNLOAD TEMPLATE ---
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
      { header: 'Passport Issue Date', key: 'passportIssue', width: 15 },
      { header: 'Passport Expiry Date', key: 'passportExpiry', width: 15 },
      { header: 'Passport Place', key: 'passportPlace', width: 15 },
      { header: 'CDC No', key: 'cdcNo', width: 15 },
      { header: 'CDC Country', key: 'cdcCountry', width: 15 },
      { header: 'CDC Issue Date', key: 'cdcIssue', width: 15 },
      { header: 'CDC Expiry Date', key: 'cdcExpiry', width: 15 },
      { header: 'INDoS No', key: 'indos', width: 15 },
      { header: 'SID No', key: 'sid', width: 15 },
      { header: 'Trainee Type', key: 'traineeType', width: 20 },
      { header: 'Date of Joining', key: 'doj', width: 18 },
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

    for (let i = 2; i <= 500; i++) {
      worksheet.getCell(`C${i}`).dataValidation = { type: 'list', formulae: ['"Male,Female,Other"'] };
      worksheet.getCell(`K${i}`).dataValidation = { type: 'list', formulae: [`RefData!$B$1:$B$${BLOOD_GROUPS.length}`] };
      worksheet.getCell(`M${i}`).dataValidation = { type: 'list', formulae: [`RefData!$C$1:$C$${RELATIONSHIPS.length}`] };
      worksheet.getCell(`Q${i}`).dataValidation = { type: 'list', formulae: [`RefData!$A$1:$A$${countries.length}`] };
      worksheet.getCell(`AA${i}`).dataValidation = { type: 'list', formulae: [`RefData!$D$1:$D$${TRAINEE_TYPES.length}`] };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'keel_cadet_import_template.xlsx');
    toast.success('Smart Template downloaded.');
  };

  // --- 2. FILE PROCESSING ---
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setFileToUpload(file); 

    try {
      const data = await file.arrayBuffer();
      // 🔥 FIX: Move cellDates: true to read()
      const wb = XLSX.read(new Uint8Array(data), { 
        type: 'array',
        cellDates: true 
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws); // No options here

      if (json.length === 0) {
        toast.error("File is empty.");
        setIsProcessing(false);
        return;
      }

      const previewMap = json.map((row: any) => ({
        fullName: getValue(row, ['Full Name', 'fullName', 'Name']),
        email: getValue(row, ['Email', 'Email Address']),
        rank: getValue(row, ['Trainee Type', 'Rank']),
        nationality: getValue(row, ['Nationality']),
      }));

      const cleanPreview = previewMap.filter(d => d.email);
      setPreviewData(cleanPreview);
    } catch (e) {
      toast.error("Failed to parse Excel file");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. TRANSFORM & UPLOAD ---
  const handleConfirmImport = async () => {
    if (!fileToUpload) return;
    
    setIsUploading(true);
    try {
      const data = await fileToUpload.arrayBuffer();
      // 🔥 FIX: Move cellDates: true to read() here too
      const wb = XLSX.read(new Uint8Array(data), { 
        type: 'array',
        cellDates: true 
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);

      const transformedData = json.map((row: any) => {
        const fullName = getValue(row, ['Full Name', 'fullName', 'Name']) || '';
        const nameParts = fullName.trim().split(/\s+/);

        return {
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          email: getValue(row, ['Email']),
          
          dob: formatDate(getValue(row, ['Date of Birth', 'dob'])),
          sign_on_date: formatDate(getValue(row, ['Date of Joining', 'DOJ'])),
          passport_issue_date: formatDate(getValue(row, ['Passport Issue Date'])),
          passport_expiry_date: formatDate(getValue(row, ['Passport Expiry Date'])),
          cdc_issue_date: formatDate(getValue(row, ['CDC Issue Date'])),
          cdc_expiry_date: formatDate(getValue(row, ['CDC Expiry Date'])),

          gender: getValue(row, ['Gender']),
          address: getValue(row, ['Address']),
          country: getValue(row, ['Country', 'Country (ISO)']),
          state: getValue(row, ['State', 'State (ISO)']),
          city: getValue(row, ['City']),
          pincode: getValue(row, ['Pin Code', 'pincode']),
          phone: getValue(row, ['Mobile', 'Phone', 'Cell']),
          blood_group: getValue(row, ['Blood Group']),
          
          kin_name: getValue(row, ['Emergency Contact Name', 'Kin Name']),
          kin_relation: getValue(row, ['Relation', 'Kin Relation']),
          kin_mobile: getValue(row, ['Emergency Mobile', 'Kin Mobile']),
          kin_email: getValue(row, ['Emergency Email', 'Kin Email']),
          
          passport_number: getValue(row, ['Passport No', 'Passport Number']),
          nationality: getValue(row, ['Nationality']),
          passport_place: getValue(row, ['Passport Place']),
          
          cdc_number: getValue(row, ['CDC No', 'CDC Number']),
          cdc_country: getValue(row, ['CDC Country']),
          
          indos_number: getValue(row, ['INDoS No', 'INDoS']),
          sid_number: getValue(row, ['SID No', 'SID']),
          rank: getValue(row, ['Trainee Type', 'Rank']),
          
          status: 'Ready',
          password: 'password123'
        };
      });

      const newSheet = XLSX.utils.json_to_sheet(transformedData);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newSheet, "CleanData");
      const wbOut = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
      const cleanBlob = new Blob([wbOut], { type: "application/octet-stream" });
      const cleanFile = new File([cleanBlob], "upload_clean.xlsx");

      const result = await importCadetsBulk(cleanFile);
      
      setImportResult(result.summary);
      onImport(); 
      toast.success("Import processing complete");

    } catch (error: any) {
      console.error("IMPORT ERROR:", error);
      toast.error(error.message || "Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPreviewData(null);
    setImportResult(null);
    setFileToUpload(null);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
       <div className={`bg-card w-full ${previewData ? 'max-w-5xl' : 'max-w-lg'} rounded-xl border border-border shadow-2xl transition-all overflow-hidden`}>
          
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
             <div className="flex items-center space-x-2 text-foreground">
                <FileSpreadsheet size={20} className="text-primary" />
                <h2 className="font-bold text-lg">Import Trainees</h2>
             </div>
             <button onClick={handleClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <X size={20} className="text-muted-foreground hover:text-foreground"/>
             </button>
          </div>
          
          {/* RESULTS SUMMARY */}
          {importResult ? (
             <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                      <h3 className="text-2xl font-bold text-green-600">{importResult.imported}</h3>
                      <p className="text-xs font-bold uppercase text-green-700">Imported Successfully</p>
                   </div>
                   <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                      <h3 className="text-2xl font-bold text-red-600">{importResult.skipped_count}</h3>
                      <p className="text-xs font-bold uppercase text-red-700">Skipped / Failed</p>
                   </div>
                </div>

                {importResult.skipped_details.length > 0 && (
                   <div className="border border-border rounded-xl overflow-hidden">
                      <div className="bg-muted/50 p-3 border-b border-border">
                         <h4 className="font-bold text-sm">Skipped Rows</h4>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                         {importResult.skipped_details.map((skip, i) => (
                            <div key={i} className="flex justify-between items-center p-2 text-xs hover:bg-muted rounded">
                               <span className="font-medium">{skip.email || 'Unknown'}</span>
                               <span className="text-red-500 font-bold">{skip.reason}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                <div className="flex justify-end">
                   <button onClick={handleClose} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold">
                      Done
                   </button>
                </div>
             </div>
          ) : (
            
            /* UPLOAD & PREVIEW */
            !previewData ? (
               <div className="p-6 space-y-6 bg-card">
                   <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-start space-x-3">
                      <AlertTriangle className="text-primary shrink-0 mt-0.5" size={18} />
                      <div className="text-sm">
                         <p className="font-bold text-foreground">Smart Import</p>
                         <p className="text-muted-foreground mt-1">Upload an Excel file to bulk create cadet accounts. Duplicate emails will be skipped.</p>
                      </div>
                   </div>

                   <div 
                     className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
                       dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
                     }`}
                     onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                     onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={handleDrop}
                     onClick={() => fileInputRef.current?.click()}
                   >
                      <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                      <div className="p-4 bg-background rounded-full shadow-sm mb-3 border border-border">
                        <Upload size={32} className="text-primary"/>
                      </div>
                      <p className="font-bold text-foreground">Click to upload or drag and drop</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">XLSX files only</p>
                   </div>

                   <div className="flex justify-start">
                      <button onClick={downloadTemplate} className="text-primary text-sm font-bold hover:underline flex items-center gap-2 transition-all p-1">
                         <Download size={16}/> Download Smart Template
                      </button>
                   </div>
               </div>
            ) : (
               <div className="flex flex-col h-125 bg-card">
                  <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                     <h3 className="font-bold text-foreground">Preview {previewData.length} Trainees</h3>
                     <button onClick={() => { setPreviewData(null); setFileToUpload(null); }} className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-primary/20">
                        <ChevronLeft size={14} /> Re-upload
                     </button>
                  </div>

                  <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted">
                     <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                           <tr className="border-b border-border">
                              <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Name</th>
                              <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Email</th>
                              <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Rank</th>
                              <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Nationality</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                           {previewData.map((t, idx) => (
                              <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                 <td className="p-4 font-bold text-foreground">{t.fullName}</td>
                                 <td className="p-4 text-muted-foreground font-medium">{t.email}</td>
                                 <td className="p-4"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold border border-primary/20">{t.rank}</span></td>
                                 <td className="p-4 text-muted-foreground font-medium">{t.nationality}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  <div className="p-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
                     <button onClick={handleClose} className="px-5 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl">Cancel</button>
                     <button 
                        onClick={handleConfirmImport} 
                        disabled={isUploading}
                        className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                     >
                        {isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/> : <CheckCircle2 size={16} />}
                        {isUploading ? 'Importing...' : 'Confirm Bulk Import'}
                     </button>
                  </div>
               </div>
            )
          )}
       </div>
    </div>
  );
};

export default ImportCadetModal;