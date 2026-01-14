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
  // 1. GENERATE SMART TEMPLATE
  // ---------------------------------------------------------
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cadets');

    worksheet.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Nationality', key: 'nationality', width: 20 },
      { header: 'Blood Group', key: 'blood', width: 10 },
      { header: 'Emergency Contact Name', key: 'kinName', width: 20 },
      { header: 'Relation', key: 'kinRelation', width: 15 },
      { header: 'Passport No', key: 'passport', width: 15 },
      { header: 'Seaman Book No', key: 'cdc', width: 15 },
      { header: 'INDoS No', key: 'indos', width: 15 },
      { header: 'Trainee Type', key: 'rank', width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3194A0' } };

    const refSheet = workbook.addWorksheet('RefData');
    refSheet.state = 'hidden';

    const countries = Country.getAllCountries().map(c => c.name);
    countries.forEach((c, i) => refSheet.getCell(`A${i+1}`).value = c);
    BLOOD_GROUPS.forEach((b, i) => refSheet.getCell(`B${i+1}`).value = b);
    RELATIONSHIPS.forEach((r, i) => refSheet.getCell(`C${i+1}`).value = r);
    TRAINEE_TYPES.forEach((t, i) => refSheet.getCell(`D${i+1}`).value = t);

    for (let i = 2; i <= 500; i++) {
        worksheet.getCell(`D${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$A$1:$A$${countries.length}`] };
        worksheet.getCell(`E${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$B$1:$B$${BLOOD_GROUPS.length}`] };
        worksheet.getCell(`G${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$C$1:$C$${RELATIONSHIPS.length}`] };
        worksheet.getCell(`K${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$D$1:$D$${TRAINEE_TYPES.length}`] };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'keel_cadet_import_template.xlsx');
    toast.success("Template downloaded.");
  };

  // ---------------------------------------------------------
  // 2. HELPER: FUZZY HEADER MATCHER
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
  // 3. FILE PARSING (FIXED BINARY READ)
  // ---------------------------------------------------------
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      // CRITICAL FIX: Convert ArrayBuffer to Uint8Array for reliable parsing
      const wb = XLSX.read(new Uint8Array(data), { type: 'array' });
      
      let targetSheetName = '';
      let headerRowIndex = 0;
      let found = false;

      // STRATEGY 1: Look for "Cadets" sheet specifically
      if (wb.SheetNames.includes('Cadets')) {
         const ws = wb.Sheets['Cadets'];
         const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
         // Scan for header row in this sheet
         for (let i = 0; i < Math.min(aoa.length, 10); i++) {
            const rowString = (aoa[i] || []).map(c => String(c).toLowerCase()).join(' ');
            if (rowString.includes('full name') && rowString.includes('email')) {
               targetSheetName = 'Cadets';
               headerRowIndex = i;
               found = true;
               break;
            }
         }
      }

      // STRATEGY 2: If not found, scan ALL sheets
      if (!found) {
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          for (let i = 0; i < Math.min(aoa.length, 10); i++) {
            const rowString = (aoa[i] || []).map(c => String(c).toLowerCase()).join(' ');
            if (rowString.includes('full name') && rowString.includes('email')) {
               targetSheetName = sheetName;
               headerRowIndex = i;
               found = true;
               break;
            }
          }
          if (found) break;
        }
      }

      if (!found) {
        toast.error("Invalid File. Could not find 'Full Name' and 'Email' columns.");
        setIsProcessing(false);
        return;
      }

      const ws = wb.Sheets[targetSheetName];
      const json = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex });

      const mappedData = json.map((row: any) => {
        const name = getValue(row, ['Full Name', 'Name', 'Trainee Name', 'name']);
        const rank = getValue(row, ['Trainee Type', 'Rank', 'Position']);
        const nationality = getValue(row, ['Nationality', 'Country']);
        const email = getValue(row, ['Email', 'Email Address']);
        const mobile = getValue(row, ['Mobile', 'Phone', 'Cell']);
        const blood = getValue(row, ['Blood Group', 'Blood']);
        const kinName = getValue(row, ['Emergency Contact Name', 'Kin Name', 'Next of Kin']);
        const kinRelation = getValue(row, ['Relation', 'Relationship']);
        const passport = getValue(row, ['Passport No', 'Passport']);
        const cdc = getValue(row, ['Seaman Book No', 'CDC', 'Seamans Book']);
        const indos = getValue(row, ['INDoS No', 'INDoS']);

        // Normalize Rank
        let finalRank = 'DECK_CADET';
        if (rank) {
            const upperRank = String(rank).toUpperCase().replace(/ /g, '_');
            if (TRAINEE_TYPES.includes(upperRank)) finalRank = upperRank;
            else if (upperRank.includes('DECK')) finalRank = 'DECK_CADET';
            else if (upperRank.includes('ENGINE')) finalRank = 'ENGINE_CADET';
            else if (upperRank.includes('ETO') || upperRank.includes('ELECTRO')) finalRank = 'ETO_CADET';
            else if (upperRank.includes('RATING')) finalRank = 'RATING';
        }

        return {
          id: `TR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: name || 'Unknown Trainee',
          rank: finalRank,
          nationality: nationality || 'Unknown',
          email: email || '',
          mobile: mobile || '',
          bloodGroup: blood || '',
          kinName: kinName || '',
          kinRelation: kinRelation || '',
          passport: passport || '',
          cdc: cdc || '',
          indos: indos || '',
          status: 'Ready',
          vessel: '',
          progress: 0
        };
      });

      const cleanData = mappedData.filter(d => d.name !== 'Unknown Trainee' && d.email !== '');
      
      if (cleanData.length === 0) {
         toast.error("No valid trainee data found.");
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
       <div className={`bg-card w-full ${previewData ? 'max-w-4xl' : 'max-w-lg'} rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 transition-all`}>
          
          <div className="flex items-center justify-between p-4 border-b border-border">
             <div className="flex items-center space-x-2 text-foreground">
                <FileSpreadsheet size={20} className="text-green-600" />
                <h2 className="font-bold text-lg">Import Trainees</h2>
             </div>
             <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground"/></button>
          </div>
          
          {!previewData ? (
             <div className="p-6 space-y-6">
                 <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm">
                       <p className="font-bold text-foreground">Smart Template Enabled</p>
                       <div className="text-muted-foreground mt-1 space-y-1">
                          <p>1. Download the template below.</p>
                          <p>2. Use the <b>Excel Dropdowns</b> in columns D, E, G & K.</p>
                          <p>3. Upload to see a preview before saving.</p>
                       </div>
                    </div>
                 </div>

                 <div 
                   className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                     dragActive 
                     ? 'border-primary bg-primary/5' 
                     : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
                   }`}
                   onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                   onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={handleDrop}
                   onClick={() => fileInputRef.current?.click()}
                 >
                    <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                    {isProcessing ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/> : <Upload size={32} className="text-primary mb-2"/>}
                    <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">XLSX files only</p>
                 </div>

                 <div className="flex justify-start">
                    <button onClick={downloadTemplate} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                       <Download size={14}/> Download Smart Template
                    </button>
                 </div>
             </div>

          ) : (
             <div className="flex flex-col h-125">
                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                   <div>
                      <h3 className="font-bold text-foreground">Preview Import</h3>
                      <p className="text-xs text-muted-foreground">Review {previewData.length} trainees before adding.</p>
                   </div>
                   <button 
                     onClick={() => setPreviewData(null)} 
                     className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                   >
                      <ChevronLeft size={14} /> Re-upload
                   </button>
                </div>

                <div className="flex-1 overflow-auto p-0">
                   <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                         <tr>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Name</th>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Rank</th>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Nationality</th>
                            <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Email</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                         {previewData.map((t, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                               <td className="p-3 font-medium text-foreground flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                     {t.name.charAt(0)}
                                  </div>
                                  {t.name}
                               </td>
                               <td className="p-3 text-muted-foreground font-mono text-xs">{t.rank}</td>
                               <td className="p-3 text-muted-foreground">{t.nationality}</td>
                               <td className="p-3 text-muted-foreground">{t.email}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="p-4 border-t border-border bg-card rounded-b-xl flex justify-end gap-3">
                   <button 
                     onClick={() => setPreviewData(null)}
                     className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={handleConfirmImport}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                   >
                      <CheckCircle2 size={16} />
                      Confirm Import
                   </button>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default ImportCadetModal;