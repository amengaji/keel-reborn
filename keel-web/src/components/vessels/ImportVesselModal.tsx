// keel-web/src/components/vessels/ImportVesselModal.tsx

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

/**
 * ImportVesselModal Component
 * This component handles the bulk import of vessel data from Excel files.
 * FIXED: Theming updated to use semantic CSS variables for perfect Light/Dark mode transitions.
 */
const ImportVesselModal: React.FC<ImportVesselModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATE MANAGEMENT ---
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  if (!isOpen) return null;

  // ---------------------------------------------------------
  // 1. GENERATE SMART TEMPLATE (ExcelJS)
  // ---------------------------------------------------------
  /**
   * Creates an Excel file with specific columns and data validation (dropdowns).
   * Note: The ARGB color FF3194A0 matches the primary Keel Teal branding.
   */
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    // --- SHEET 1: VESSELS (Data Entry) ---
    const worksheet = workbook.addWorksheet('Vessels');

    // Define Columns - These headers are used by the fuzzy matcher during import
    worksheet.columns = [
      { header: 'Vessel Name', key: 'name', width: 25 },
      { header: 'IMO Number', key: 'imo_number', width: 15 },
      { header: 'Flag', key: 'flag', width: 20 },
      { header: 'Classification Society', key: 'class_society', width: 40 },
      { header: 'Vessel Type', key: 'vessel_type', width: 25 },
    ];

    // Style the Header Row (Keel Teal theme)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3194A0' } 
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

    // --- APPLY VALIDATION (Rows 2 to 1000) ---
    for (let i = 2; i <= 1000; i++) {
      // Column D: Classification Society dropdown
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Reference!$A$1:$A$${classCount}`],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid Classification Society from the provided list.'
      };

      // Column E: Vessel Type dropdown
      worksheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`Reference!$B$1:$B$${typeCount}`],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Invalid Selection',
        error: 'Please select a valid Vessel Type from the provided list.'
      };
    }

    // Generate the file buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'keel_vessel_import_template.xlsx');
    
    toast.success("Smart Template downloaded successfully.");
  };

  // ---------------------------------------------------------
  // 2. HELPER: FUZZY HEADER MATCHER
  // ---------------------------------------------------------
  /**
   * Novice-friendly logic: Extracts values even if the Excel column name 
   * is slightly different (e.g., "vessel_name" vs "Vessel Name").
   */
  const getValue = (row: any, targetKeys: string[]) => {
    // Normalize keys to lowercase alphanumeric only for easy comparison
    const normalize = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    
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
        toast.error("The uploaded file appears to be empty.");
        setIsProcessing(false);
        return;
      }

      // TRANSFORM & VALIDATE DATA FOR THE BACKEND
      const mappedData = jsonData.map((row: any) => {
        const name = getValue(row, ['Vessel Name', 'name', 'vessel_name']);
        const imo = getValue(row, ['IMO Number', 'imo', 'imo_number']);
        const flag = getValue(row, ['Flag', 'flag', 'country']);
        const class_soc = getValue(row, ['Classification Society', 'class', 'classification', 'class_society']);
        const v_type = getValue(row, ['Vessel Type', 'type', 'vessel_type']);

        return {
          id: imo ? `VSL-${imo}` : `VSL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: name || 'Unnamed Vessel',
          imo_number: String(imo || ''), 
          flag: flag || 'Unknown',
          class_society: class_soc || 'Unknown', 
          vessel_type: v_type || 'Other', 
          is_active: true, 
          program: 'Cadet Training Program'
        };
      });

      // Show the preview table to the user
      setPreviewData(mappedData);

    } catch (err) {
      toast.error("Failed to parse the Excel file. Please ensure it is a valid .xlsx or .xls file.");
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
      // Passes the cleaned data back to VesselsPage.tsx for persistence
      onImport(previewData);
      onClose();
      setPreviewData(null); 
    }
  };

  /**
   * Handles Drag and Drop functionality for better UX.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className={`bg-card w-full ${previewData ? 'max-w-5xl' : 'max-w-xl'} rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 transition-all overflow-hidden`}>
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-2 text-foreground">
            <FileSpreadsheet size={20} className="text-primary" />
            <h2 className="font-bold text-lg">Import Vessels</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground transition-all p-1.5 rounded-lg hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT SWITCHER: UPLOAD VIEW OR PREVIEW TABLE */}
        {!previewData ? (
          
          /* --- UPLOAD VIEW --- */
          <div className="p-6 space-y-6">
            
            {/* INSTRUCTIONS BOX - Semantic blue colors for alerts */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start space-x-3">
               <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={18} />
               <div className="text-sm">
                  <p className="font-bold text-foreground">Smart Template Recommended</p>
                  <p className="text-muted-foreground mt-1 leading-relaxed">
                    1. Use the link below to get the Keel Smart Template.<br/>
                    2. Select values from the <b>Dropdown Menus</b> in Excel to avoid import errors.<br/>
                    3. Upload the file to see a preview of the fleet data.
                  </p>
               </div>
            </div>

            {/* INTERACTIVE DROP ZONE: Responsive to theme variables */}
            <div 
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
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
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-sm font-bold text-muted-foreground">Parsing Fleet Data...</p>
                  </div>
               ) : (
                  <>
                    <div className="p-4 bg-background rounded-full shadow-sm mb-3 border border-border">
                      <Upload size={24} className="text-primary" />
                    </div>
                    <p className="font-bold text-foreground">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Excel (XLSX, XLS) only</p>
                  </>
               )}
            </div>

            {/* DOWNLOAD TEMPLATE LINK */}
            <div className="flex justify-center items-center pt-2">
              <button 
                onClick={downloadTemplate} 
                className="text-sm text-primary hover:text-primary/80 font-bold flex items-center space-x-2 p-2.5 hover:bg-primary/5 rounded-xl transition-all"
              >
                <Download size={16} />
                <span>Download Keel Smart Template</span>
              </button>
            </div>
          </div>

        ) : (

          /* --- PREVIEW TABLE VIEW --- */
          <div className="flex flex-col max-h-[75vh]"> 
             <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                   <h3 className="font-bold text-foreground">Preview Fleet Import</h3>
                   <p className="text-xs text-muted-foreground font-medium">Found {previewData.length} vessel records. Review before adding to database.</p>
                </div>
                <button 
                  onClick={() => setPreviewData(null)} 
                  className="text-xs font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-1 transition-all"
                >
                   <ChevronLeft size={14} /> Re-upload File
                </button>
             </div>

             {/* DATA PREVIEW TABLE: Connected to theme-safe colors */}
             <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted">
                <table className="w-full text-left text-sm border-collapse">
                   <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr className="border-b border-border">
                         <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Vessel Name</th>
                         <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">IMO Number</th>
                         <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Flag</th>
                         <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Type</th>
                         <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-widest">Class Society</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border bg-card">
                      {previewData.map((vessel, idx) => (
                         <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="p-4 font-bold text-foreground">{vessel.name}</td>
                            <td className="p-4 font-mono text-muted-foreground font-bold">{vessel.imo_number}</td>
                            <td className="p-4 text-foreground font-medium">{vessel.flag}</td>
                            <td className="p-4">
                               <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-primary/20">
                                  {vessel.vessel_type}
                               </span>
                            </td>
                            <td className="p-4 text-muted-foreground text-xs font-medium truncate max-w-xs" title={vessel.class_society}>
                               {vessel.class_society}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* MODAL FOOTER ACTIONS */}
             <div className="p-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setPreviewData(null)}
                  className="px-5 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                >
                   Discard
                </button>
                <button 
                   onClick={handleConfirmImport}
                   className="bg-primary hover:brightness-110 text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                   <CheckCircle2 size={16} />
                   Confirm Fleet Import
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportVesselModal;