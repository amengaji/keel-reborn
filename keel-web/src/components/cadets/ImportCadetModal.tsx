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

  if (!isOpen) return null;

  // 1. GENERATE SMART TEMPLATE
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
    
    // Fill Columns in Reference Sheet
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

  // 2. PARSE FILE
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      onImport(json); // Parent handles the data mapping
      onClose();
    } catch (e) {
      toast.error("Import failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
       <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
             <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <FileSpreadsheet className="text-green-600"/> Import Cadets
             </h2>
             <button onClick={onClose}><X size={20} className="text-muted-foreground"/></button>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3">
             <AlertTriangle className="text-blue-500 shrink-0" size={18}/>
             <div className="text-sm">
                <p className="font-bold text-foreground">Smart Template</p>
                <p className="text-muted-foreground">Use the dropdowns in the Excel file for Nationality, Rank, and Blood Group to ensure data consistency.</p>
             </div>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
          >
             <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
             {isProcessing ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/> : <Upload size={32} className="text-primary mb-2"/>}
             <p className="font-medium text-foreground">Click to Upload Excel</p>
          </div>

          <div className="flex justify-start">
             <button onClick={downloadTemplate} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                <Download size={14}/> Download Template
             </button>
          </div>
       </div>
    </div>
  );
};

export default ImportCadetModal;