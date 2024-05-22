import cloudinary from './cloudinary.js';
import userSchema from "./userSchema.js";
import express from 'express';
import multer from 'multer';
import postSchema from './postSchema.js';
import getConnection from './connection.js';
import { Readable } from 'stream';

const router = express.Router();
const dataBase = new getConnection();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/publish/:id', upload.single('photo'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { nickname, email, campus, content, references, isAnonymous, avatar } = req.body;
        const photo = req.file;


        if (!content) {
            return res.status(400).json({ message: 'Insira um conteúdo na publicação' });
        }

        if (isAnonymous !== 'true' && isAnonymous !== 'false') {
            return res.status(400).json({ message: 'É necessário definir o tipo da postagem' });
        }

        if (!userId) {
            return res.status(400).json({ message: 'É necessário passar o id do usuário para postagem' })
        }

        await dataBase.connect();

        const savePost = async (photoURL = null) => {
            const postToSave = {
                nickname,
                email,
                campus,
                content,
                references,
                isAnonymous,
                photoURL,
                userAvatar: avatar
            };

            await postSchema.create(postToSave);

            res.status(200).json({ message: 'Dados recebidos com sucesso!', posted: true });
        };

        // Verificar se a foto foi enviada
        if (photo) {
            const uploadStream = cloudinary.uploader.upload_stream({ folder: 'posts' }, (error, result) => {
                if (error) {
                    console.error('Erro ao realizar upload da imagem:', error);
                    return res.status(500).json({ message: 'Erro ao realizar upload da imagem' });
                }
                console.log('Resultado do upload da imagem', result);
                savePost(result.url);
            });

            const readablePhotoStream = new Readable();
            readablePhotoStream.push(photo.buffer);
            readablePhotoStream.push(null);
            readablePhotoStream.pipe(uploadStream);
        } else {
            savePost();
        }

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Erro ao processar a solicitação' });
    } finally {

    }
});

router.get('/get/:id/:skip/:limit', async (req, res) => {
    const { id, skip, limit } = req.params;

    // Verificações dos parâmetros
    if (!skip || isNaN(skip)) {
        return res.status(400).json({ message: "É necessário repassar um skip válido" });
    }
    if (!limit || isNaN(limit)) {
        return res.status(400).json({ message: "É necessário repassar um limit válido" });
    }
    if (!id) {
        return res.status(400).json({ message: "É necessário repassar um id para busca" });
    }

    try {
        await dataBase.connect();

        const skipValue = parseInt(skip);
        const limitValue = parseInt(limit);

        // Buscando os posts no banco de dados
        const posts = await postSchema.find().skip(skipValue).limit(limitValue);

        if (!posts) {
            return res.status(500).json({ message: "Ocorreu um erro ao recuperar os posts. Tente novamente." });
        }

        res.status(200).json({ posts });
    } catch (error) {
        console.error('Erro ao recuperar posts:', error);
        res.status(500).json({ message: "Ocorreu um erro ao recuperar os posts. Tente novamente." });
    } finally {
    }
});

export default router;
