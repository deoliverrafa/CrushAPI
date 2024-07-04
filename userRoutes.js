import express from 'express';
import getConnection from './connection.js';
import userSchema from './userSchema.js';
import jwt from 'jsonwebtoken'
const router = express.Router()
const dataBase = new getConnection();

router.get("/:token", async (req, res) => {

    try {

        const token = req.params.token

        if (!token) {
            res.status(400).json({ message: "É preciso especificar um token" })
        }

        let decodedObj;

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                res.status(403).json({ message: 'Token Expirado' })
            }
            res.status(403).json({ message: 'Token Inválido' })
        }

        await dataBase.connect()

        if (!token) {
            res.status(400).json({ message: "token não especificado" })
        }

        const userFinded = await userSchema.findOne({ _id: decodedObj.user._id })

        if (!userFinded) {
            res.status(400).json({ message: "Usuário não encontrado" })
        }

        res.status(200).json({ userFinded })

    } catch (error) {
        res.status(500).json({ error })
    }
})

export default router;