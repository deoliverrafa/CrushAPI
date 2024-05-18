import express from 'express';
import getConnection from './connection.js';
import userSchema from './userSchema.js';

const router = express.Router()
const dataBase = new getConnection();

router.get("/:id", async (req, res) => {

    const id = req.params.id
    await dataBase.connect()
    
    if (!id) {
        return res.status(400).json({ message: "Id não especificado" })
    }

    const userFinded = await userSchema.findOne({ _id: id })

    if (!userFinded) {
        return res.status(400).json({ message: "Usuário não encontrado" })
    }

    res.status(200).json({ userFinded })
})

export default router;