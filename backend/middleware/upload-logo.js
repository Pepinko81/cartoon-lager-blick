import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Speicherkonfiguration für Multer - Logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const logosDir = path.join(__dirname, "..", "logos");
    cb(null, logosDir);
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
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Nur Bilddateien (JPEG, PNG, GIF, WEBP, SVG) sind erlaubt."));
  }
};

const uploadLogo = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit
  },
  fileFilter: fileFilter,
});

export default uploadLogo;

