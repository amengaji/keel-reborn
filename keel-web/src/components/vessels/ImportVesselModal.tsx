//keel-web/src/components/vessels/ImportVesselModal.tsx

import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2, ChevronLeft, Users, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { CLASSIFICATION_SOCIETIES, VESSEL_TYPES } from '../../constants/maritimeData';
import { importVesselsBulk, ImportSummary } from '../../services/importService';

interface ImportVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

const ImportVesselModal: React.FC<ImportVesselModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  if (!isOpen) return null;

  // --- 1. TEMPLATE GENERATION (Unchanged) ---
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vessels');

    worksheet.columns = [
      { header: 'Vessel Name', key: 'name', width: 25 },
      { header: 'IMO Number', key: 'imo_number', width: 15 },
      { header: 'Flag', key: 'flag', width: 20 },
      { header: 'Classification Society', key: 'class_society', width: 40 },
      { header: 'Vessel Type', key: 'vessel_type', width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3194A0' } };

    const refSheet = workbook.addWorksheet('Reference');
    refSheet.state = 'hidden';

    CLASSIFICATION_SOCIETIES.forEach((cls, index) => refSheet.getCell(`A${index + 1}`).value = cls);
    VESSEL_TYPES.forEach((type, index) => refSheet.getCell(`B${index + 1}`).value = type);

    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`D${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`Reference!$A$1:$A$${CLASSIFICATION_SOCIETIES.length}`] };
      worksheet.getCell(`E${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`Reference!$B$1:$B$${VESSEL_TYPES.length}`] };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'keel_vessel_import_template.xlsx');
    toast.success("Smart Template downloaded.");
  };

  const getValue = (row: any, targetKeys: string[]) => {
    const normalize = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rowKeys = Object.keys(row);
    for (const target of targetKeys) {
      const foundKey = rowKeys.find(k => normalize(k) === normalize(target));
      if (foundKey) return row[foundKey];
    }
    return null;
  };

  // --- 2. FILE HANDLING ---
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setFileToUpload(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      
      if (jsonData.length === 0) {
        toast.error("File is empty.");
        setIsProcessing(false);
        return;
      }

      const mappedData = jsonData.map((row: any) => ({
        name: getValue(row, ['Vessel Name', 'name', 'vessel_name']) || 'Unnamed',
        imo_number: getValue(row, ['IMO Number', 'imo', 'imo_number']),
        flag: getValue(row, ['Flag', 'flag', 'country']),
        vessel_type: getValue(row, ['Vessel Type', 'type', 'vessel_type']),
      }));

      setPreviewData(mappedData);

    } catch (err) {
      toast.error("Failed to parse file.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. CONFIRM & UPLOAD ---
  const handleConfirmImport = async () => {
    if (!fileToUpload) return;
    setIsUploading(true);
    try {
      const result = await importVesselsBulk(fileToUpload);
      setImportResult(result.summary);
      onImport(); // Refresh
      toast.success("Vessels imported successfully");
    } catch (error: any) {
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className={`bg-card w-full ${previewData ? 'max-w-6xl' : 'max-w-xl'} rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 transition-all overflow-hidden`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-2 text-foreground">
            <FileSpreadsheet size={20} className="text-primary" />
            <h2 className="font-bold text-lg">Import Vessels</h2>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-all p-1.5 rounded-lg hover:bg-muted">
            <X size={20} />
          </button>
        </div>

        {/* RESULTS VIEW */}
        {importResult ? (
           <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center">
                    <h3 className="text-2xl font-bold text-green-600">{importResult.imported}</h3>
                    <p className="text-xs font-bold uppercase text-green-700">Vessels Added</p>
                 </div>
                 <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                    <h3 className="text-2xl font-bold text-red-600">{importResult.skipped_count}</h3>
                    <p className="text-xs font-bold uppercase text-red-700">Skipped (Duplicates)</p>
                 </div>
              </div>
              
              {importResult.skipped_details.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                   <div className="bg-muted/50 p-3 border-b border-border">
                      <h4 className="font-bold text-sm">Issues Found</h4>
                   </div>
                   <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                      {importResult.skipped_details.map((skip, i) => (
                         <div key={i} className="flex justify-between items-center p-2 text-xs hover:bg-muted rounded">
                            <span className="font-medium">{skip.name || 'Unknown Vessel'}</span>
                            <span className="text-red-500 font-bold">{skip.reason}</span>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="flex justify-end">
                 <button onClick={handleClose} className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold">Done</button>
              </div>
           </div>
        ) : (
          
          /* PREVIEW & UPLOAD VIEW */
          !previewData ? (
             <div className="p-6 space-y-6">
               <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start space-x-3">
                  <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                  <div className="text-sm">
                     <p className="font-bold text-foreground">Smart Import</p>
                     <p className="text-muted-foreground mt-1">Upload a vessel fleet list. Existing IMO numbers will be skipped.</p>
                  </div>
               </div>

               <div 
                 className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50'}`}
                 onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                 onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDrop}
                 onClick={() => fileInputRef.current?.click()}
               >
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                  {isProcessing ? (
                     <div className="flex flex-col items-center space-y-3">
                       <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                       <p className="text-sm font-bold text-muted-foreground">Parsing Fleet Data...</p>
                     </div>
                  ) : (
                     <>
                       <div className="p-4 bg-background rounded-full shadow-sm mb-3 border border-border"><Upload size={24} className="text-primary" /></div>
                       <p className="font-bold text-foreground">Click to upload or drag and drop</p>
                     </>
                  )}
               </div>

               <div className="flex justify-center pt-2">
                 <button onClick={downloadTemplate} className="text-sm text-primary hover:text-primary/80 font-bold flex items-center space-x-2 p-2.5 hover:bg-primary/5 rounded-xl transition-all">
                   <Download size={16} /><span>Download Template</span>
                 </button>
               </div>
             </div>
          ) : (
            <div className="flex flex-col max-h-[75vh]"> 
               <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                     <h3 className="font-bold text-foreground">Preview Fleet Import</h3>
                     <p className="text-xs text-muted-foreground font-medium">Found {previewData.length} vessels.</p>
                  </div>
                  <button onClick={() => { setPreviewData(null); setFileToUpload(null); }} className="text-xs font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-1">
                     <ChevronLeft size={14} /> Re-upload
                  </button>
               </div>

               <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted">
                  <table className="w-full text-left text-sm border-collapse">
                     <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr className="border-b border-border">
                           <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Vessel Name</th>
                           <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">IMO Number</th>
                           <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Flag</th>
                           <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Type</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border bg-card">
                        {previewData.map((vessel, idx) => (
                           <tr key={idx} className="hover:bg-muted/20 transition-colors">
                              <td className="p-4 font-bold text-foreground">{vessel.name}</td>
                              <td className="p-4 font-mono text-muted-foreground font-bold">{vessel.imo_number}</td>
                              <td className="p-4 text-foreground font-medium">{vessel.flag}</td>
                              <td className="p-4"><span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-primary/20">{vessel.vessel_type}</span></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="p-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
                  <button onClick={handleClose} className="px-5 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl">Discard</button>
                  <button onClick={handleConfirmImport} disabled={isUploading} className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
                     {isUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/> : <CheckCircle2 size={16} />}
                     {isUploading ? 'Importing...' : 'Confirm Fleet Import'}
                  </button>
               </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ImportVesselModal;