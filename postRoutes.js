import { Readable } from 'stream';
import mongoose from 'mongoose';
import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken'


// Local Imports
import cloudinary from './cloudinary.js';
import userSchema from "./userSchema.js";
import postSchema from './postSchema.js';
import getConnection from './connection.js';


const router = express.Router();
const dataBase = new getConnection();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/publish/:token', upload.single('photo'), async (req, res) => {
    try {
        const token = req.params.token;
        const { nickname, email, campus, content, references, isAnonymous, avatar } = req.body;
        const photo = req.file;


        if (!content) {
            return res.status(400).json({ message: 'Insira um conteúdo na publicação' });
        }

        if (isAnonymous !== 'true' && isAnonymous !== 'false') {
            return res.status(400).json({ message: 'É necessário definir o tipo da postagem' });
        }

        if (!token) {
            return res.status(400).json({ message: 'É necessário passar o id do usuário para postagem' })
        }

        await dataBase.connect();

        const decodedObj = jwt.decode(token, process.env.JWT_SECRET)

        const userFound = userSchema.findOne({ _id: decodedObj.user._id })

        const savePost = async (photoURL = null) => {
            const postToSave = {
                nickname,
                email,
                campus,
                content,
                references,
                isAnonymous,
                photoURL,
                userAvatar: avatar,
                userId: new mongoose.Types.ObjectId(decodedObj.user._id)
            };

            await postSchema.create(postToSave);

            return res.status(200).json({ message: 'Dados recebidos com sucesso!', posted: true });
        };

        // Verificar se a foto foi enviada
        if (photo) {
            const uploadStream = cloudinary.uploader.upload_stream({ folder: 'posts' }, (error, result) => {
                if (error) {
                    console.error('Erro ao realizar upload da imagem:', error);
                    return res.status(500).json({ message: 'Erro ao realizar upload da imagem' });
                }
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
        return res.status(500).json({ error: 'Erro ao processar a solicitação' });
    } finally {

    }
});

router.get('/get/:token/:skip/:limit', async (req, res) => {
    const { token, skip, limit } = req.params;

    let decodedObj;

    try {
        decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name == "TokenExpiredError") {
            return res.status(403).json({ message: 'Token Expirado', validToken: false })
        }
        return res.status(403).json({ message: 'Token Inválido', validToken: false })
    }

    if (!skip || isNaN(skip)) {
        return res.status(400).json({ message: "É necessário repassar um skip válido" });
    }
    if (!limit || isNaN(limit)) {
        return res.status(400).json({ message: "É necessário repassar um limit válido" });
    }
    if (!token) {
        return res.status(400).json({ message: "É necessário repassar um token válido para busca", validToken: false });
    }

    try {
        await dataBase.connect();

        const skipValue = parseInt(skip);
        const limitValue = parseInt(limit);

        const posts = await postSchema.find().sort({ insertAt: -1 }).skip(skipValue).limit(limitValue);

        if (!posts) {
            return res.status(500).json({ message: "Ocorreu um erro ao recuperar os posts. Tente novamente." });
        }

        return res.status(200).json({ posts });
    } catch (error) {
        console.error('Erro ao recuperar posts:', error);
        return res.status(500).json({ message: "Ocorreu um erro ao recuperar os posts. Tente novamente." });
    } finally {
    }
});

router.post('/like', async (req, res) => {
    const { token, postId } = req.body;

    try {
        const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

        await dataBase.connect();

        const post = await postSchema.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado', found: false });
        }

        if (post.likedBy.includes(decodedObj.user._id)) {
            return res.status(400).json({ message: 'Você já curtiu esse post', alreadyLiked: true });
        }

        post.likedBy.push(decodedObj.user._id);
        post.likeCount += 1;
        await post.save();

        return res.status(200).json({ message: 'Post curtido com sucesso', likeCount: post.likeCount, liked: true });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Token Expirado', validToken: false });
        }
        return res.status(403).json({ message: 'Token Inválido', validToken: false });
    }
});

router.post('/unlike', async (req, res) => {
    const { token, postId } = req.body;

    console.log("Recebido token:", token);
    console.log("Recebido postId:", postId);

    try {
        const decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token decodificado:", decodedObj);

        await dataBase.connect();
        console.log("Banco de dados conectado");

        const post = await postSchema.findById(postId);
        console.log("Post encontrado:", post);

        if (!post) {
            console.log("Post não encontrado");
            return res.status(404).json({ message: 'Post não encontrado', found: false });
        }

        if (!post.likedBy.includes(decodedObj.user._id)) {
            console.log("Usuário não curtiu o post");
            return res.status(400).json({ message: 'Você ainda não curtiu esse post', notLiked: true });
        }

        post.likedBy = post.likedBy.filter(userId => userId.toString() !== decodedObj.user._id.toString());
        post.likeCount = Math.max(post.likeCount - 1, 0);
        await post.save();
        console.log("Post atualizado com sucesso");

        return res.status(200).json({ message: 'Like removido com sucesso', likeCount: post.likeCount, unLiked: true });
    } catch (error) {
        console.error("Erro capturado:", error);

        if (error.name === 'TokenExpiredError') {
            console.log("Token expirado");
            return res.status(403).json({ message: 'Token Expirado', validToken: false });
        }
        console.log("Token inválido");
        return res.status(403).json({ message: 'Token Inválido', validToken: false });
    }
});


export default router;