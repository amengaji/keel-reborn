import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface ImportTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (flatData: any[]) => void;
}

// UPDATED: Full descriptive names for Excel Dropdown
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

const DEPARTMENTS = ['Deck', 'Engine', 'Galley'];
const RANKS = ['DECK_CADET', 'ENGINE_CADET', 'RATING'];
const FREQUENCIES = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'];
// UPDATED: Evidence Option
const EVIDENCE = ['DOCUMENT/PHOTO', 'NONE'];
const VERIFICATION = ['OBSERVATION', 'Q&A', 'WRITTEN'];

const ImportTaskModal: React.FC<ImportTaskModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('TRB Tasks');

    sheet.columns = [
      { header: 'Function (Select from List)', key: 'part_number', width: 35 }, // Wider for full name
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

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      
      if (json.length > 0 && !('part_number' in (json[0] as object))) {
         toast.error("Invalid Format. Please use the Smart Template.");
         setIsProcessing(false);
         return;
      }

      onImport(json);
      onClose();
    } catch (e) {
      toast.error("Failed to parse Excel file.");
    } finally {
      setIsProcessing(false);
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
       <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
             <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <FileSpreadsheet className="text-green-600"/> Import TRB Syllabus
             </h2>
             <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground"/></button>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
             <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
             <div className="text-sm">
                <p className="font-bold text-foreground">Smart Template Enabled</p>
                <div className="text-muted-foreground mt-1 space-y-1">
                  <p>1. Download the template below.</p>
                  <p>2. Use the <b>Excel Dropdowns</b> (e.g. "1 - Navigation", "DOCUMENT/PHOTO").</p>
                  <p>3. Uploading will <b>merge</b> or <b>replace</b> based on Task ID.</p>
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
       </div>
    </div>
  );
};

export default ImportTaskModal;