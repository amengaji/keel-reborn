//keel-backend/src/middleware/upload.middleware.ts

import multer from 'multer';

// specific configuration for Excel/CSV files
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

// We use memoryStorage to process the file buffer directly without saving to disk
const storage = multer.memoryStorage();

const uploadFile = multer({ 
  storage: storage, 
  fileFilter: excelFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit: 5MB
});

export default uploadFile;