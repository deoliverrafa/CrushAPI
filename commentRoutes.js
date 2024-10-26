import getConnection from './connection.js';
import postSchema from './postSchema.js';
import commentSchema from './commentSchema.js'

import express from 'express';
import jwt from 'jsonwebtoken'

const router = express.Router();
const dataBase = new getConnection();

router.post('/comment', async (req, res) => {
    try {
        const { content, postId, token, userId } = req.body
        console.log(req.body);
        
        jwt.verify(token, process.env.JWT_SECRET);

        await dataBase.connect();

        const post = await postSchema.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Postagem não encontrada ou deletada", posted: false })
        }

        const newComment = await commentSchema.create({
            userId: userId,
            content,
        });

        post.comments.push(newComment._id);
        post.commentCount = post.comments.length;
        
        await post.save();

        return res.status(200).json({ message: "Postado", posted: true })
    } catch (error) {
        console.error("Erro capturado:", error);

        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Token Expirado', validToken: false, posted: false, error });
        }
        return res.status(403).json({ message: 'Token Inválido', validToken: false, posted: false, error });
    }
})

router.get('/getComment/:token/:postId', async (req, res) => {
    try {
        const { token, postId } = req.params
        const skip = parseInt(req.query.skip) || 0
        const limit = parseInt(req.query.limit) || 10

        jwt.verify(token, process.env.JWT_SECRET);

        const post = await postSchema.findById(postId)
            .populate({
                path: 'comments',
                options: {
                    skip: skip,
                    limit: limit,
                    sort: { insertAt: -1 }
                }
            });

        if (!post) {
            return res.status(404).json({ message: "Post não encontrado" });
        }
        
        return res.status(200).json({comments: post.comments});
    } catch (error) {
        console.error("Erro capturado:", error);

        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Token Expirado', validToken: false, posted: false, error });
        }
        return res.status(403).json({ message: 'Token Inválido', validToken: false, posted: false, error });
    }
})

export default router;