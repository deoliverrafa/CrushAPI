import express from "express";
import multer from "multer";
import { Readable } from 'stream';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const router = express.Router();

import getConnection from "./connection.js";
import userSchema from "./userSchema.js";
import cloudinary from "./cloudinary.js";

const dataBase = new getConnection();

router.post("/updatePhoto", multer().single('avatar'), async (req, res) => {
    try {

        const token = req.params.token

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token", validToken: false })
        }

        let decodedObj;

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: 'Token Expirado', validToken: false })
            }
            return res.status(403).json({ message: 'Token Inválido', validToken: false })
        }


        const photo = req.file;

        if (!photo) {
            return res.status(400).json({ message: "É necessário selecionar uma imagem para upload do avatar" });
        }

        const validMimeTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if (!validMimeTypes.includes(photo.mimetype)) {
            return res.status(400).json({ message: 'Insira uma imagem válida' });
        }

        await dataBase.connect();

        const userFound = await userSchema.findOne({ _id: decodedObj.user._id });

        if (!userFound) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'avatar' },
            async (error, result) => {
                if (error) {
                    console.log("Erro ao realizar upload de imagem", error);
                    return res.status(500).json({ message: 'Erro ao realizar upload de imagem' });
                }

                // Atualizar o URL da foto do usuário no banco de dados
                userFound.avatar = result.url;
                await userFound.save();

                return res.status(201).json({ message: "Update realizado com sucesso", avatarURL: result.url, updated: true });
            }
        );

        const readablePhotoStream = new Readable();
        readablePhotoStream.push(photo.buffer);
        readablePhotoStream.push(null);
        readablePhotoStream.pipe(uploadStream);

    } catch (error) {
        console.error("Erro ao atualizar foto", error);
        return res.status(500).json({ message: "Erro ao atualizar foto", error });
    }
});

router.post("/changeNameCampus/:token", multer().none(), async (req, res) => {
    try {

        const token = req.params.token
        const { nickname, campus } = req.body

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token", validToken: false })
        }

        if (!nickname || !campus) {
            return res.status(404).json({ message: "Campo faltando", updated: false })
        }

        let decodedObj;

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: 'Token Expirado', validToken: false })
            }
            return res.status(403).json({ message: 'Token Inválido', validToken: false })
        }

        console.log('Objeto decodificado', decodedObj);

        await dataBase.connect()

        const userFound = await userSchema.findOneAndUpdate({
            _id: decodedObj.user._id,
            nickname: nickname,
            campus: campus,
        })

        if (!userFound) {
            return res.status(400).json({ message: "Erro ao procurar usuário", userFound, updated: false })
        }

        return res.status(200).json({ message: "Atualizado com sucesso", updated: true })

    } catch (error) {
        console.error("Erro ao mudar nome", error)
        return res.status(500).json({ message: "Erro ao atualizar dados", error })
    }
})

router.post("/changePassword/:token", multer().none(), async (req, res) => {
    try {

        const token = req.params.token
        const { password, novasenha } = req.body

        console.log("Requisição", req.body);

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token", validToken: false })
        }

        let decodedObj;

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: 'Token Expirado', validToken: false })
            }
            return res.status(403).json({ message: 'Token Inválido', validToken: false })
        }

        await dataBase.connect()

        const foundUserToComparePassword = await userSchema.findOne({ _id: decodedObj.user._id })

        const comparePassword = await bcrypt.compare(password, foundUserToComparePassword.password)

        console.log("Comparou", comparePassword);

        if (!comparePassword || comparePassword == false) {
            return res.status(400).json({ message: 'Senha incorreta' })
        }

        const encryptingNewPassword = await bcrypt.hash(novasenha, 10)

        console.log("Encryptou", encryptingNewPassword);
        const userFound = await userSchema.findOneAndUpdate({
            _id: decodedObj.user._id,
            password: encryptingNewPassword
        })

        console.log('Salvou usuário', userFound);

        if (!userFound || userFound == null) {
            return res.status(400).json({ message: "Erro ao procurar usuário", userFound, updated: false })
        }
        console.log("Tudo certo");
        return res.status(200).json({ message: "Atualizado com sucesso", updated: true })

    } catch (error) {
        console.error("Erro ao mudar senha", error)
        return res.status(500).json({ message: "Erro ao mudar senha", error })
    }
})

router.post("/changeEmail/:token", multer().none(), async (req, res) => {
    try {
        const token = req.params.token
        const { email } = req.body

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token", validToken: false })
        }

        let decodedObj;

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: 'Token Expirado', validToken: false })
            }
            return res.status(403).json({ message: 'Token Inválido', validToken: false })
        }

        await dataBase.connect()

        const userFound = await userSchema.findOneAndUpdate({
            _id: decodedObj.user._id,
            email: email
        })

        if (!userFound) {
            return res.status(400).json({ message: "Erro ao procurar usuário", userFound, updated: false })
        }

        return res.status(200).json({ message: "Atualizado com sucesso", updated: true })

    } catch (error) {
        console.error("Erro ao mudar email", error)
        return res.status(500).json({ message: "Erro ao atualizar dados", error })
    }
})

export default router;
