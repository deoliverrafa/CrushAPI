const express = require('express')
const router = express.Router()

const getConnection = require('./connection');
const userShcema = require('./userSchema')
const dataBase = new getConnection();

router.get("/:id", async (req, res) => {

    const id = req.params.id
    await dataBase.connect()
    if (!id) {
        return res.status(400).json({ message: "Id não especificado" })
    }

    const userFinded = await userShcema.findOne({ _id: id })

    if (!userFinded) {
        return res.status(400).json({ message: "Usuário não encontrado" })
    }

    res.status(200).json({ userFinded })
})

module.exports = router;