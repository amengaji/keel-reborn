// keel-web/src/components/trb/ImportTaskModal.tsx

import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface ImportTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (flatData: any[]) => void;
}

// DROPDOWN CONSTANTS
const STCW_FUNCTIONS = [
  '1 - Navigation',
  '2 - Cargo Handling & Stowage',
  '3 - Controlling the Operation of the Ship',
  '4 - Marine Engineering',
  '5 - Electrical, Electronic & Control Engineering',
  '6 - Maintenance and Repair',
  '7 - Radio Communications'
];

const STCW_REFS = [
  'A-II/1', 'A-II/2', 'A-II/3', 'A-II/4', 'A-II/5',
  'A-III/1', 'A-III/2', 'A-III/4', 'A-III/5', 'A-III/6', 'A-III/7',
  'A-VI/1', 'A-VI/2', 'A-VI/3', 'A-VI/4', 'A-VI/5', 'A-VI/6'
];

const DEPARTMENTS = ['Deck', 'Engine', 'Galley', 'Electrical'];
const RANKS = ['DECK_CADET', 'ENGINE_CADET', 'ETO_CADET', 'RATING'];
const FREQUENCIES = ['ONCE', 'TWICE', 'DAILY', 'WEEKLY', 'MONTHLY', 'EVERY_VOYAGE', 'EVERY_VESSEL'];
const EVIDENCE = ['DOCUMENT/PHOTO', 'NONE'];
const VERIFICATION = ['OBSERVATION', 'Q&A', 'WRITTEN'];

const ImportTaskModal: React.FC<ImportTaskModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  if (!isOpen) return null;

  // ---------------------------------------------------------
  // 1. DOWNLOAD TEMPLATE
  // ---------------------------------------------------------
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TRB Tasks');

    sheet.columns = [
      { header: 'Function (Select from List)', key: 'part_number', width: 35 }, 
      { header: 'Section / Topic', key: 'section_name', width: 30 },
      { header: 'Task Title', key: 'title', width: 40 },
      { header: 'Description / Competence', key: 'description', width: 40 },
      { header: 'Instructions', key: 'instructions', width: 50 },
      { header: 'STCW Ref', key: 'stcw_reference', width: 15 },
      { header: 'Dept', key: 'department', width: 12 },
      { header: 'Rank', key: 'trainee_type', width: 15 },
      { header: 'Safety Req', key: 'safety_requirements', width: 20 },
      { header: 'Frequency', key: 'frequency', width: 12 },
      { header: 'Mandatory', key: 'mandatory_for_all', width: 12 },
      { header: 'Evidence', key: 'evidence_type', width: 20 },
      { header: 'Verification', key: 'verification_method', width: 15 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3194A0' } };

    const refSheet = workbook.addWorksheet('RefData');
    refSheet.state = 'hidden';

    const fillCol = (col: string, data: string[]) => data.forEach((v, i) => refSheet.getCell(`${col}${i+1}`).value = v);
    
    fillCol('A', STCW_FUNCTIONS);
    fillCol('B', STCW_REFS);
    fillCol('C', DEPARTMENTS);
    fillCol('D', RANKS);
    fillCol('E', FREQUENCIES);
    fillCol('F', EVIDENCE);
    fillCol('G', VERIFICATION);

    for (let i = 2; i <= 500; i++) {
        sheet.getCell(`A${i}`).dataValidation = { type: 'list', allowBlank: false, formulae: [`RefData!$A$1:$A$${STCW_FUNCTIONS.length}`] };
        sheet.getCell(`F${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$B$1:$B$${STCW_REFS.length}`] };
        sheet.getCell(`G${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$C$1:$C$${DEPARTMENTS.length}`] };
        sheet.getCell(`H${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$D$1:$D$${RANKS.length}`] };
        sheet.getCell(`J${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$E$1:$E$${FREQUENCIES.length}`] };
        sheet.getCell(`K${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"TRUE,FALSE"'] }; 
        sheet.getCell(`L${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$F$1:$F$${EVIDENCE.length}`] };
        sheet.getCell(`M${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`RefData!$G$1:$G$${VERIFICATION.length}`] };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'keel_trb_smart_template.xlsx');
    toast.success("Smart Template downloaded.");
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
  // 3. FILE PARSING (FIXED LOGIC)
  // ---------------------------------------------------------
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      
      if (json.length === 0) {
         toast.error("File is empty.");
         setIsProcessing(false);
         return;
      }

      // MAP EXCEL HEADERS TO DATABASE KEYS
      const mappedData = json.map((row: any, idx: number) => {
        let partNum = getValue(row, ['Function (Select from List)', 'Function', 'part_number', 'Part']) || '1';
        
        // Extract "1" from "1 - Navigation" if present
        if (partNum && typeof partNum === 'string' && partNum.includes(' - ')) {
            partNum = partNum.split(' - ')[0]; 
        }

        // --- FIX: Auto-Generate Unique Code ---
        // Backend requires 'code' (unique string). We generate one if missing.
        const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const autoCode = `TRB-${partNum}-${uniqueSuffix}-${idx}`;

        return {
            // Mapped exactly to what Task Controller expects:
            code: autoCode, 
            partNum: partNum, // Controller expects 'partNum' or 'function_code'
            section: getValue(row, ['Section / Topic', 'Section', 'section_name', 'Topic']), // Controller expects 'section' or 'category'
            title: getValue(row, ['Task Title', 'title', 'Task']),
            description: getValue(row, ['Description / Competence', 'Description', 'description', 'Competence']),
            instructions: getValue(row, ['Instructions', 'instructions']),
            // Note: Controller doesn't strictly use STCW ref, but we pass it just in case
            stcw: getValue(row, ['STCW Ref', 'stcw_reference']),
            
            department: getValue(row, ['Dept', 'department']),
            safety: getValue(row, ['Safety Req', 'safety_requirements']), // Controller expects 'safety' or 'safety_level'
            
            // Extra fields (might be used by frontend or future backend updates)
            trainee_type: getValue(row, ['Rank', 'trainee_type', 'Role']),
            frequency: getValue(row, ['Frequency', 'frequency']),
            mandatory_for_all: String(getValue(row, ['Mandatory', 'mandatory_for_all'])).toUpperCase() === 'TRUE',
            evidence_type: getValue(row, ['Evidence', 'evidence_type']),
            verification_method: getValue(row, ['Verification', 'verification_method'])
        };
      });

      // VALIDATION: Check if essential data exists in mapped rows
      const validRows = mappedData.filter(d => d.title && d.partNum);

      if (validRows.length === 0) {
         toast.error("Invalid Format. Could not find Task Titles or Functions.");
         setIsProcessing(false);
         return;
      }

      setPreviewData(validRows);

    } catch (e) {
      toast.error("Failed to parse Excel file.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
       <div className={`bg-card w-full ${previewData ? 'max-w-6xl' : 'max-w-lg'} rounded-xl border border-border shadow-2xl p-6 space-y-6 transition-all`}>
          
          <div className="flex justify-between items-center border-b border-border pb-4">
             <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <FileSpreadsheet className="text-green-600"/> Import TRB Syllabus
             </h2>
             <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground"/></button>
          </div>
          
          {!previewData ? (
            <>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
                 <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                 <div className="text-sm">
                    <p className="font-bold text-foreground">Smart Template Enabled</p>
                    <div className="text-muted-foreground mt-1 space-y-1">
                      <p>1. Download the template below.</p>
                      <p>2. Use the <b>Excel Dropdowns</b> (e.g. "1 - Navigation", "DOCUMENT/PHOTO").</p>
                      <p>3. Uploading will <b>merge</b> or <b>replace</b> based on Task Title.</p>
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
              </div>

              <div className="flex justify-start">
                 <button onClick={downloadTemplate} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                    <Download size={14}/> Download Smart Template
                 </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-[60vh]">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-muted-foreground">Found {previewData.length} valid tasks</span>
                  <button onClick={() => setPreviewData(null)} className="text-xs text-red-500 hover:underline">Discard</button>
               </div>
               
               <div className="flex-1 overflow-auto border border-border rounded-lg scrollbar-thin scrollbar-thumb-muted">
                  <table className="w-full text-left text-xs">
                     <thead className="bg-muted sticky top-0">
                        <tr>
                           <th className="p-3 font-bold">Function</th>
                           <th className="p-3 font-bold">Topic</th>
                           <th className="p-3 font-bold">Task Title</th>
                           <th className="p-3 font-bold">Unique Code (Auto)</th>
                           <th className="p-3 font-bold">Rank</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                        {previewData.map((task, idx) => (
                           <tr key={idx} className="hover:bg-muted/30">
                              <td className="p-3 font-mono">{task.partNum}</td>
                              <td className="p-3 truncate max-w-[150px]">{task.section}</td>
                              <td className="p-3 font-medium">{task.title}</td>
                              <td className="p-3 text-muted-foreground font-mono text-[10px]">{task.code}</td>
                              <td className="p-3">
                                 <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {task.trainee_type}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="flex justify-end pt-4 gap-3">
                  <button onClick={() => setPreviewData(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                  <button onClick={handleConfirmImport} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                     <CheckCircle2 size={16} /> Confirm Import
                  </button>
               </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default ImportTaskModal;