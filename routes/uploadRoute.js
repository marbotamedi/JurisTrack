import express from 'express';
import path from 'path';
import supabase from '../config/supabase.js';
import {upload} from '../middlewares/multer.js';

const Bucket_Name = 'teste';
const router = express.Router();



router.post('/', upload.single('file'), async (req, res) => {
    try {
            if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }

            const file = req.file;

            const fileExtension = path.extname(req.file.originalname);
            const baseName = path.basename(file.originalname, fileExtension);
            // 1. Normaliza a string (remove acentuações como 'ã' -> 'a')
            const normalizedBaseName = baseName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            //2. Substitui caracteres não alfanuméricos e espaços por hífens (-)
            const safeBaseName = normalizedBaseName
                .replace(/[^a-zA-Z0-9\s]/g, "") // Remove caracteres especiais, exceto espaços
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-'); // Substitui espaços por hífens

            // 3. Cria o nome final do arquivo
            /*const fileName = `${Date.now()}-${safeBaseName}${fileExtension}`;*/
            const fileName = `${safeBaseName}${fileExtension}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
            .from(Bucket_Name)
            .upload(filePath, file.buffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.mimetype,
            });
            
            if (error) {
            console.error('Erro ao fazer upload para o Supabase:', error);
            return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
            }

            const {data: publicUrlData } = supabase.storage
                .from(Bucket_Name)
                .getPublicUrl(filePath);
            
            res.status(200).json({ message: 'Arquivo enviado com sucesso', fileName: fileName, publicUrl: publicUrlData.publicUrl });
            
        } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        res.status(500).json({ error: 'Erro ao enviar arquivo' });
    }
});

export default router;

