import express from 'express';
import getConnection from './connection.js';
import userSchema from './userSchema.js';
import jwt from 'jsonwebtoken'
const router = express.Router()
const dataBase = new getConnection();

router.get("/token/:token", async (req, res) => {

    try {

        const token = req.params.token
        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token" })
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

        if (!token) {
            return res.status(400).json({ message: "token não especificado", validToken: false })
        }

        const userFinded = await userSchema.findOne({ _id: decodedObj.user._id })

        if (!userFinded) {
            return res.status(400).json({ message: "Usuário não encontrado" })
        }

        return res.status(200).json({ userFinded })

    } catch (error) {
        return res.status(500).json({ error })
    }
})

router.get("/id/:id", async (req, res) => {
    try {
        const id = req.params.id

        await dataBase.connect()

        if (!id) {
            return res.status(400).json({ message: "id não especificado" })
        }

        const userFinded = await userSchema.findOne({ _id: id })

        if (!userFinded || userFinded == null) {
            return res.status(200).json({
                nickname: 'Deletado',
                campus: 'Deletado',
                email: 'Deletado',
                avatar: 'path/to/deleted-user-avatar.png' // URL para um avatar padrão
            });
        }

        return res.status(200).json({ userFinded })

    } catch (error) {
        return res.status(500).json({ userFinded: { nickname: 'Deletado', campus: 'Deletado', email: 'Deletado', bio: 'Deletado' } })
    }
})

export default router;