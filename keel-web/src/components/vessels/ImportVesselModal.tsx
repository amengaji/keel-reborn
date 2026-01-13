import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2, ChevronLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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
  
  // STATE MANAGEMENT
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  if (!isOpen) return null;

  // ---------------------------------------------------------
  // 1. GENERATE SMART TEMPLATE (ExcelJS)
  // ---------------------------------------------------------
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    // --- SHEET 1: VESSELS (Data Entry) ---
    const worksheet = workbook.addWorksheet('Vessels');

    // Define Columns with exact headers expected by the parser
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
      fgColor: { argb: 'FF3194A0' } // Keel Teal
    };

    // --- SHEET 2: REFERENCE (Hidden Source for Dropdowns) ---
    const refSheet = workbook.addWorksheet('Reference');
    refSheet.state = 'hidden';

    // Populate Reference Data for Validation Lists
    CLASSIFICATION_SOCIETIES.forEach((cls: string, index: number) => {
      refSheet.getCell(`A${index + 1}`).value = cls;
    });
    
    VESSEL_TYPES.forEach((type: string, index: number) => {
      refSheet.getCell(`B${index + 1}`).value = type;
    });

    const classCount = CLASSIFICATION_SOCIETIES.length;
    const typeCount = VESSEL_TYPES.length;

    // --- APPLY VALIDATION ---
    for (let i = 2; i <= 1000; i++) {
      // Column D: Classification Society
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Reference!$A$1:$A$${classCount}`],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Class',
        error: 'Please select a valid Classification Society from the list.'
      };

      // Column E: Vessel Type
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
    
    toast.success("Smart Template downloaded successfully.");
  };

  // ---------------------------------------------------------
  // 2. HELPER: FUZZY HEADER MATCHER
  // ---------------------------------------------------------
  // This finds the value even if the column name is "vessel_name" or "Vessel Name "
  const getValue = (row: any, targetKeys: string[]) => {
    const normalize = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try to find a matching key in the row
    const rowKeys = Object.keys(row);
    for (const target of targetKeys) {
      const foundKey = rowKeys.find(k => normalize(k) === normalize(target));
      if (foundKey) return row[foundKey];
    }
    return null;
  };

  // ---------------------------------------------------------
  // 3. FILE PARSING & PREVIEW GENERATION
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
        setIsProcessing(false);
        return;
      }

      // VALIDATION SETS
      const validClasses = new Set(CLASSIFICATION_SOCIETIES);
      const validTypes = new Set(VESSEL_TYPES);
      const errors: string[] = [];

      // TRANSFORM & VALIDATE
      const mappedData = jsonData.map((row: any, index: number) => {
        const rowNum = index + 2; 

        // Use Fuzzy Matcher to find values
        const name = getValue(row, ['Vessel Name', 'name', 'vessel_name']);
        const imo = getValue(row, ['IMO Number', 'imo', 'imo_number']);
        const flag = getValue(row, ['Flag', 'flag', 'country']);
        const classSociety = getValue(row, ['Classification Society', 'class', 'classification']);
        const type = getValue(row, ['Vessel Type', 'type', 'vessel_type']);

        // Build System Object
        const mappedRow = {
          id: imo ? `VSL-${imo}` : `VSL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: name || 'Unknown Vessel',
          imo: String(imo || 'N/A'),
          flag: flag || 'Unknown',
          classSociety: classSociety || 'Unknown',
          type: type || 'Other',
          status: 'Active', 
          program: 'Cadet Training Program'
        };

        // Validate Class
        if (mappedRow.classSociety !== 'Unknown' && !validClasses.has(mappedRow.classSociety)) {
          // Allow loose matching or just warn
          // errors.push(`Row ${rowNum}: Invalid Class '${mappedRow.classSociety}'`);
        }

        return mappedRow;
      });

      // SET PREVIEW DATA
      setPreviewData(mappedData);

    } catch (err) {
      toast.error("Failed to parse Excel file.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------
  // 4. FINAL IMPORT HANDLER
  // ---------------------------------------------------------
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
      <div className={`bg-card w-full ${previewData ? 'max-w-4xl' : 'max-w-xl'} rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 transition-all`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2 text-foreground">
            <FileSpreadsheet size={20} className="text-teal-600" />
            <h2 className="font-bold text-lg">Import Vessels</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT SWITCHER: UPLOAD vs PREVIEW */}
        {!previewData ? (
          
          // --- STATE A: UPLOAD UI ---
          <div className="p-6 space-y-6">
            
            {/* INSTRUCTIONS */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start space-x-3">
               <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
               <div className="text-sm">
                  <p className="font-bold text-foreground">Smart Template Enabled</p>
                  <p className="text-muted-foreground mt-1">
                    1. Download the template below.<br/>
                    2. Use the <b>Excel Dropdowns</b> to ensure valid data.<br/>
                    3. Uploading will show a preview before saving.
                  </p>
               </div>
            </div>

            {/* DROP ZONE */}
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

            {/* FOOTER ACTIONS */}
            <div className="flex justify-between items-center pt-2">
              <button onClick={downloadTemplate} className="text-sm text-primary hover:underline flex items-center space-x-1">
                <Download size={14} />
                <span>Download Smart Template</span>
              </button>
            </div>
          </div>

        ) : (

          // --- STATE B: PREVIEW UI ---
          <div className="flex flex-col h-[500px]"> 
             <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                <div>
                   <h3 className="font-bold text-foreground">Preview Import</h3>
                   <p className="text-xs text-muted-foreground">Review {previewData.length} vessels before adding to fleet.</p>
                </div>
                <button 
                  onClick={() => setPreviewData(null)} 
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                   <ChevronLeft size={14} /> Re-upload
                </button>
             </div>

             {/* PREVIEW TABLE */}
             <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-left text-sm border-collapse">
                   <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                      <tr>
                         <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Vessel Name</th>
                         <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">IMO</th>
                         <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Flag</th>
                         <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Type</th>
                         <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Class</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                      {previewData.map((vessel, idx) => (
                         <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-3 font-medium text-foreground">{vessel.name}</td>
                            <td className="p-3 font-mono text-muted-foreground">{vessel.imo}</td>
                            <td className="p-3 text-muted-foreground">{vessel.flag}</td>
                            <td className="p-3 text-muted-foreground">
                               <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] border border-blue-200 dark:border-blue-800">
                                  {vessel.type}
                               </span>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">{vessel.classSociety}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* PREVIEW ACTIONS */}
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

export default ImportVesselModal;