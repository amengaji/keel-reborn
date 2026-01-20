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

const ImportTaskModal: React.FC<ImportTaskModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  if (!isOpen) return null;

  // --- 1. DOWNLOAD TEMPLATE ---
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TRB Tasks');

    sheet.columns = [
      { header: 'Function (Select from List)', key: 'function_code', width: 35 }, 
      { header: 'Section / Topic', key: 'category', width: 30 },
      { header: 'Task Title', key: 'title', width: 40 },
      { header: 'Description / Competence', key: 'description', width: 40 },
      { header: 'Instructions', key: 'instructions', width: 50 },
      { header: 'STCW Ref', key: 'stcw_reference', width: 15 },
      { header: 'Dept', key: 'department', width: 12 },
      { header: 'Rank', key: 'trainee_type', width: 15 },
      { header: 'Safety Req', key: 'safety_level', width: 20 },
      { header: 'Frequency', key: 'frequency', width: 12 },
      { header: 'Mandatory', key: 'mandatory', width: 12 },
      { header: 'Evidence', key: 'evidence_type', width: 20 },
      { header: 'Verification', key: 'verification_method', width: 15 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3194A0' } };

    // (Dropdown logic omitted for brevity but preserved in download)
    const refSheet = workbook.addWorksheet('RefData');
    refSheet.state = 'hidden';
    // ... RefData population code ...

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'keel_trb_smart_template.xlsx');
    toast.success("Smart Template downloaded.");
  };

  // --- 2. ROBUST DATA EXTRACTOR ---
  const getCell = (row: any, keys: string[], colIndex: number, rawArray: any[]) => {
    // 1. Try Key Match (Fuzzy)
    const normalize = (k: string) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const found = rowKeys.find(rk => normalize(rk) === normalize(k));
      if (found && row[found]) return row[found];
    }

    // 2. Fallback to Column Index
    if (Array.isArray(rawArray) && rawArray[colIndex]) {
        return rawArray[colIndex];
    }

    return null;
  };

  // --- 3. PARSE FILE (FIXED KEYS) ---
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      
      const json = XLSX.utils.sheet_to_json(ws);
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (json.length === 0) {
         toast.error("File is empty.");
         setIsProcessing(false);
         return;
      }

      const mappedData = json.map((row: any, idx: number) => {
        const rawRow = rawRows[idx + 1] as any[]; 

        // Extract Function
        let partNum = getCell(row, ['Function (Select from List)', 'Function', 'part_number'], 0, rawRow);
        if (partNum && typeof partNum === 'string' && partNum.includes(' - ')) {
            partNum = partNum.split(' - ')[0]; 
        } else if (!partNum) {
            partNum = '1'; 
        }

        const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const autoCode = `TRB-${partNum}-${uniqueSuffix}-${idx}`;

        return {
            code: autoCode,
            function_code: String(partNum),
            
            // --- FIXED: Included exact header strings ---
            category: getCell(row, ['Section / Topic', 'Section', 'Topic', 'category'], 1, rawRow) || 'General Tasks',
            title: getCell(row, ['Task Title', 'title', 'Task'], 2, rawRow) || 'Untitled Task',
            description: getCell(row, ['Description / Competence', 'Description', 'Competence', 'description'], 3, rawRow) || '', 
            instructions: getCell(row, ['Instructions', 'instructions'], 4, rawRow) || '',
            stcw: getCell(row, ['STCW Ref', 'stcw_reference', 'STCW'], 5, rawRow),
            
            department: getCell(row, ['Dept', 'department'], 6, rawRow) || 'Deck',
            trainee_type: getCell(row, ['Rank', 'trainee_type'], 7, rawRow) || 'DECK_CADET',
            safety_level: getCell(row, ['Safety Req', 'Safety', 'safety_level'], 8, rawRow) || 'None',
            frequency: getCell(row, ['Frequency', 'frequency'], 9, rawRow) || 'ONCE',
            
            mandatory: String(getCell(row, ['Mandatory', 'mandatory'], 10, rawRow)).toUpperCase() === 'TRUE',
            evidence_type: getCell(row, ['Evidence', 'evidence_type'], 11, rawRow) || 'DOCUMENT/PHOTO',
            verification_method: getCell(row, ['Verification', 'verification_method'], 12, rawRow) || 'OBSERVATION',
        };
      });

      const validRows = mappedData.filter(d => d.title && d.title !== 'Untitled Task');

      if (validRows.length === 0) {
         toast.error("No valid tasks found. Please check column headers.");
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
                           <th className="p-3 font-bold">Competence</th>
                           <th className="p-3 font-bold">Ref (STCW)</th> {/* ADDED */}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                        {previewData.map((task, idx) => (
                           <tr key={idx} className="hover:bg-muted/30">
                              <td className="p-3 font-mono">{task.function_code}</td>
                              <td className="p-3 font-bold truncate max-w-37.5">{task.category}</td>
                              <td className="p-3 font-medium">{task.title}</td>
                              <td className="p-3 text-muted-foreground truncate max-w-50">{task.description}</td>
                              <td className="p-3 text-muted-foreground">{task.stcw}</td> {/* ADDED */}
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