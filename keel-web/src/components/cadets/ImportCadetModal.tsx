import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';
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

  if (!isOpen) return null;

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cadets');

    // HEADERS
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

    // STYLE HEADER
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3194A0' } };

    // REFERENCE SHEET (HIDDEN)
    const refSheet = workbook.addWorksheet('RefData');
    refSheet.state = 'hidden';

    // Populate Reference Lists
    const countries = Country.getAllCountries().map(c => c.name);
    
    countries.forEach((c, i) => refSheet.getCell(`A${i+1}`).value = c);
    BLOOD_GROUPS.forEach((b, i) => refSheet.getCell(`B${i+1}`).value = b);
    RELATIONSHIPS.forEach((r, i) => refSheet.getCell(`C${i+1}`).value = r);
    TRAINEE_TYPES.forEach((t, i) => refSheet.getCell(`D${i+1}`).value = t);

    // APPLY VALIDATION
    for (let i = 2; i <= 500; i++) {
        // Nationality (Col D)
        worksheet.getCell(`D${i}`).dataValidation = {
            type: 'list', allowBlank: true, formulae: [`RefData!$A$1:$A$${countries.length}`]
        };
        // Blood Group (Col E)
        worksheet.getCell(`E${i}`).dataValidation = {
            type: 'list', allowBlank: true, formulae: [`RefData!$B$1:$B$${BLOOD_GROUPS.length}`]
        };
        // Relation (Col G)
        worksheet.getCell(`G${i}`).dataValidation = {
            type: 'list', allowBlank: true, formulae: [`RefData!$C$1:$C$${RELATIONSHIPS.length}`]
        };
        // Rank (Col K)
        worksheet.getCell(`K${i}`).dataValidation = {
            type: 'list', allowBlank: true, formulae: [`RefData!$D$1:$D$${TRAINEE_TYPES.length}`]
        };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'keel_cadet_import_template.xlsx');
    toast.success("Template downloaded.");
  };

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      onImport(json); 
      onClose();
    } catch (e) {
      toast.error("Import failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // DRAG HANDLERS
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
                <FileSpreadsheet className="text-green-600"/> Import Cadets
             </h2>
             <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground"/></button>
          </div>
          
          {/* NEW: INSTRUCTIONS BLOCK */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
             <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
             <div className="text-sm">
                <p className="font-bold text-foreground">Smart Template Enabled</p>
                <div className="text-muted-foreground mt-1 space-y-1">
                  <p>1. Download the template below.</p>
                  <p>2. Use the <b>Excel Dropdowns</b> in columns D, E, G & K.</p>
                  <p>3. If you copy-paste data, ensure it matches the valid lists exactly.</p>
                </div>
             </div>
          </div>

          {/* DRAG AND DROP ZONE */}
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
    </div>
  );
};

export default ImportCadetModal;