import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Speicherkonfiguration für Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bilderDir = path.join(__dirname, "..", "bilder");
    cb(null, bilderDir);
  },
  filename: (req, file, cb) => {
    // Dateiname: timestamp-originalname
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const filename = `${timestamp}-${baseName}${ext}`;
    cb(null, filename);
  },
});

// Dateityp-Validierung
const fileFilter = (req, file, cb) => {
  // Erlaube nur Bildformate
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Nur Bilddateien (JPEG, PNG, GIF, WEBP) sind erlaubt."));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
  fileFilter: fileFilter,
});

export default upload;

