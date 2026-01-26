//keel-backend/src/middleware/upload.middleware.ts

import multer from 'multer';

// --- 1. Storage Engine (Memory) ---
const storage = multer.memoryStorage();

// --- 2. Excel Filter (For Data Imports) ---
const excelFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (
    file.mimetype.includes("excel") || 
    file.mimetype.includes("spreadsheetml") || 
    file.mimetype.includes("csv") ||
    file.mimetype === "text/csv" ||
    file.originalname.match(/\.(xlsx|csv)$/)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Please upload only Excel or CSV files."), false);
  }
};

// --- 3. Evidence Filter (For TRB Tasks) ---
const evidenceFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'application/pdf', 
    'video/mp4', 
    'video/quicktime'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Images, PDFs, and Videos are allowed."), false);
  }
};

// --- EXPORTS ---

// DEFAULT: Excel Uploader (Keep existing behavior)
const excelUpload = multer({ 
  storage: storage, 
  fileFilter: excelFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
export default excelUpload;

// NAMED: General/Evidence Uploader (For Task Routes)
export const upload = multer({
  storage: storage,
  fileFilter: evidenceFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for videos/evidence
});