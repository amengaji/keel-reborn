import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx'; // Keep for FAST READING
import ExcelJS from 'exceljs'; // NEW: For RICH WRITING
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { CLASSIFICATION_SOCIETIES, VESSEL_TYPES } from '../../constants/maritimeData';

interface ImportVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}

const ImportVesselModal: React.FC<ImportVesselModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // ---------------------------------------------------------
  // 1. GENERATE SMART TEMPLATE (Now using ExcelJS)
  // ---------------------------------------------------------
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    // --- SHEET 1: VESSELS (Data Entry) ---
    const worksheet = workbook.addWorksheet('Vessels');

    // Define Columns
    worksheet.columns = [
      { header: 'Vessel Name', key: 'name', width: 25 },
      { header: 'IMO Number', key: 'imo', width: 15 },
      { header: 'Flag', key: 'flag', width: 20 },
      { header: 'Classification Society', key: 'class', width: 40 },
      { header: 'Vessel Type', key: 'type', width: 25 },
    ];

    // Style the Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3194A0' } // Keel Teal Background
    };

    // --- SHEET 2: REFERENCE (Hidden Source for Dropdowns) ---
    const refSheet = workbook.addWorksheet('Reference');
    refSheet.state = 'hidden'; // Hide it from the user to keep things clean

    // Populate Reference Data
    // Column A: Class Societies
    CLASSIFICATION_SOCIETIES.forEach((cls, index) => {
      refSheet.getCell(`A${index + 1}`).value = cls;
    });
    
    // Column B: Vessel Types
    VESSEL_TYPES.forEach((type, index) => {
      refSheet.getCell(`B${index + 1}`).value = type;
    });

    const classCount = CLASSIFICATION_SOCIETIES.length;
    const typeCount = VESSEL_TYPES.length;

    // --- APPLY VALIDATION (The Dropdowns) ---
    // We apply validation to rows 2 through 1000
    for (let i = 2; i <= 1000; i++) {
      
      // Column D: Classification Society (Dropdown from Ref!A1:A_Count)
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Reference!$A$1:$A$${classCount}`],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Class',
        error: 'Please select a valid Classification Society from the list.'
      };

      // Column E: Vessel Type (Dropdown from Ref!B1:B_Count)
      worksheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Reference!$B$1:$B$${typeCount}`],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Type',
        error: 'Please select a valid Vessel Type from the list.'
      };
    }

    // Generate and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'keel_vessel_import_template.xlsx');
    
    toast.success("Smart Template with Dropdowns downloaded.");
  };

  // ---------------------------------------------------------
  // 2. FILE PARSING (Stays with XLSX for speed)
  // ---------------------------------------------------------
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        toast.error("File is empty.");
        return;
      }

      // --- STRICT VALIDATION (Server-Side Gatekeeper) ---
      const validClasses = new Set(CLASSIFICATION_SOCIETIES);
      const validTypes = new Set(VESSEL_TYPES);
      const errors: string[] = [];

      const cleanData = jsonData.map((row: any, index: number) => {
        const rowNum = index + 2; 
        
        // Validate Class
        const cls = row['Classification Society'];
        if (cls && !validClasses.has(cls)) {
          errors.push(`Row ${rowNum}: Invalid Class '${cls}'`);
        }

        // Validate Type
        const type = row['Vessel Type'];
        if (type && !validTypes.has(type)) {
          errors.push(`Row ${rowNum}: Invalid Type '${type}'`);
        }

        return row;
      });

      if (errors.length > 0) {
        toast.error(`Validation Failed: ${errors.slice(0, 2).join("; ")}...`);
        return; 
      }
      
      onImport(jsonData);
      onClose();
    } catch (err) {
      toast.error("Failed to parse Excel file.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-xl rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2 text-foreground">
            <FileSpreadsheet size={20} className="text-green-600" />
            <h2 className="font-bold text-lg">Import Vessels</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* INSTRUCTIONS */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
             <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
             <div className="text-sm">
                <p className="font-bold text-foreground">Smart Template Enabled</p>
                <p className="text-muted-foreground mt-1">
                  1. Download the template below.<br/>
                  2. Use the <b>Excel Dropdowns</b> in columns D & E.<br/>
                  3. If you copy-paste data, ensure it matches the valid lists exactly.
                </p>
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
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".xlsx,.xls" 
              className="hidden" 
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
            
            {isProcessing ? (
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            ) : (
               <>
                 <div className="p-4 bg-background rounded-full shadow-sm mb-3">
                   <Upload size={24} className="text-primary" />
                 </div>
                 <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                 <p className="text-xs text-muted-foreground mt-1">XLSX or XLS files only</p>
               </>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex justify-between items-center pt-2">
            <button onClick={downloadTemplate} className="text-sm text-primary hover:underline flex items-center space-x-1">
              <Download size={14} />
              <span>Download Smart Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportVesselModal;