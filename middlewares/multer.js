import multer from "multer";

// Tipos de arquivos permitidos
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
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
          "Tipo de arquivo inválido. Apenas imagens (JPEG, PNG, GIF, PDF) são permitidas."
        ),
        false
      );
    }
  },
  // tamanho de arquivo (Ex: 5MB)
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB em bytes
  },
});


export { upload };
