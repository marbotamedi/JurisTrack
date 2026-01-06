import multer from "multer";

// Tipos de arquivos permitidos (Geral)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/DOCx",
  "application/XLSx",
  "text/plain", 
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

const storage = multer.memoryStorage();

// Middleware Geral (usado em fichaProcesso e outros)
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo inválido. Apenas imagens e documentos suportados."), false);
    }
  },
  limits: { fileSize: 12 * 1024 * 1024 },
});

// NOVO: Middleware Exclusivo para Upload de PDF (usado na página upload.html)
const uploadPdf = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo inválido. Apenas arquivos PDF são permitidos nesta rota."), false);
    }
  },
  limits: { fileSize: 12 * 1024 * 1024 },
});

export { upload, uploadPdf };