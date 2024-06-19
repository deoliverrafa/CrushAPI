import express from "express";
import multer from "multer";
import { Readable } from 'stream';

const router = express.Router();

import getConnection from "./connection.js";
import userSchema from "./userSchema.js";
import cloudinary from "./cloudinary.js";

const dataBase = new getConnection();

router.post("/updatePhoto/:id", multer().single('avatar'), async (req, res) => {
    const id = req.params.id;
    const photo = req.file;

    try {
        if (!photo) {
            return res.status(400).json({ message: "É necessário selecionar uma imagem para upload do avatar" });
        }

        const validMimeTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if (!validMimeTypes.includes(photo.mimetype)) {
            return res.status(400).json({ message: 'Insira uma imagem válida' });
        }

        await dataBase.connect();

        const userFound = await userSchema.findOne({ _id: id });

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

                res.status(201).json({ message: "Update realizado com sucesso", avatarURL: result.url, updated: true });
            }
        );

        const readablePhotoStream = new Readable();
        readablePhotoStream.push(photo.buffer);
        readablePhotoStream.push(null);
        readablePhotoStream.pipe(uploadStream);

    } catch (error) {
        console.error("Erro ao atualizar foto", error);
        res.status(500).json({ message: "Erro ao atualizar foto", error });
    }
});

router.post("/changeNameCampus/:id", async (req, res) => {
    try {
        const { nick, campus } = req.body
        const { id } = req.params.id

        if (!nick || !campus) {
            res.status(404).json({ message: "Campo faltando",  updated: false})
        }

        await dataBase.connect()

        const userFound = await userSchema.findOneAndUpdate({
            _id: id,
            nickname: nick,
            campus: campus,
        })

        if (!userFound) {
            res.status(400).json({ message: "Erro ao procurar usuário", userFound, updated: false })
        }

        res.status(200).json({ message: "Atualizado com sucesso", updated: true })

    } catch (error) {
        console.error("Erro ao mudar nome", error)
        res.status(500).json({ message: "Erro ao atualizar dados", error })
    }
})

router.post("/changePassword/:id", async (req, res) => {
    try {

    } catch (error) {
        console.error("Erro ao mudar senha", error)
        res.status(500).json({ message: "Erro ao mudar senha", error })
    }
})

router.post("/changeEmail/:id", async (req, res) => {
    try {

    } catch (error) {
        console.error("Erro ao mudar email", error)
        res.status(500).json({ message: "Erro ao atualizar dados", error })
    }
})

export default router;
