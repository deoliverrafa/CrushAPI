import { v2 as cloudinary } from 'cloudinary';
import express from 'express';
import multer from 'multer';
import postSchema from './postSchema.js';
import getConnection from './connection.js';

const router = express.Router();
const dataBase = new getConnection();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

router.post('/publish', upload.single('photo'), async (req, res) => {
    try {
        const { nickname, email, campus, content, references, isAnonymous } = req.body;
        const photo = req.file;    
        
        if (!content) {
            return res.status(400).json({ message: 'Insira um conteúdo na publicação' });
        }

        if (typeof isAnonymous !== 'boolean') {
            return res.status(400).json({ message: 'É necessário definir o tipo da postagem' });
        }

        const postToSave = {
            nickname,
            email,
            campus,
            content,
            references,
            isAnonymous
        };

        await dataBase.connect();

        let uploadResult;
        if (photo) {
            uploadResult = await cloudinary.uploader.upload_stream({
                resource_type: 'image',
                public_id: photo.originalname,
                folder: 'posts'
            }, (error, result) => {
                if (error) {
                    console.error('Error uploading image:', error);
                    return res.status(500).json({ message: "Erro ao realizar upload da imagem" });
                }
                return result;
            });

            if (!uploadResult) {
                return res.status(500).json({ message: "Erro ao realizar upload da imagem" });
            }
        }

        const resultPost = await postSchema.create(postToSave);

        res.status(200).json({ message: 'Dados recebidos com sucesso!', post: resultPost });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Erro ao processar a solicitação' });
    } finally {
        await dataBase.disconnect();
    }
});

export default router;
