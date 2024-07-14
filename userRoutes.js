import express from 'express';
import getConnection from './connection.js';
import userSchema from './userSchema.js';
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';

const router = express.Router();
const dataBase = new getConnection();

router.get("/token/:token", async (req, res) => {
    try {
        const token = req.params.token;

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token" });
        }

        let decodedObj;

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: 'Token Expirado', validToken: false });
            }
            return res.status(403).json({ message: 'Token Inválido', validToken: false });
        }

        await dataBase.connect();

        const userFinded = await userSchema.findOne({ _id: decodedObj.user._id });

        if (!userFinded) {
            return res.status(400).json({ message: "Usuário não encontrado" });
        }

        return res.status(200).json({ userFinded });

    } catch (error) {
        return res.status(500).json({ error });
    }
});

router.get("/id/:id", async (req, res) => {
    try {
        const queryId = req.params.id;

        console.log("ID recebido na rota: ", queryId);

        if (!queryId) {
            return res.status(400).json({ message: "ID não especificado" });
        }

        // Conecta ao banco de dados
        await dataBase.connect();

        // Busca o usuário pelo _id
        const userFinded = await userSchema.findOne({ _id: queryId });
        console.log("Usuário encontrado no MongoDB: ", userFinded);

        if (!userFinded) {
            return res.status(404).json({
                message: "Usuário não encontrado",
                nickname: 'Deletado',
                campus: 'Deletado',
                email: 'Deletado',
                avatar: ''
            });
        }

        return res.status(200).json({ userFinded });

    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        return res.status(500).json({ message: "Erro ao buscar usuário", error });
    }
});

export default router;
