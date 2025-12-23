import multer from "multer";

// Tipos de arquivos permitidos
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/DOCx",
  "application/XLSx",
  "text/plain", //(.txt)  
  "application/msword", //(.doc)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", //(.docx)
  "application/vnd.ms-excel", // (.xls)
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // (.xlsx)
];

//Armazenamento (continua na memória)
const storage = multer.memoryStorage();


const upload = multer({
  storage: storage,
  // filtro de arquivo
  fileFilter: (req, file, cb) => {
    //
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Tipo de arquivo inválido. Apenas imagens (JPEG, PNG, GIF, PDF, DOCx, XLSx) são permitidas."
        ),
        false
      );
    }
  },
  // tamanho de arquivo (Ex: 12MB)
  limits: {
    fileSize: 12 * 1024 * 1024, // 12 MB em bytes
  },
});


export { upload };
