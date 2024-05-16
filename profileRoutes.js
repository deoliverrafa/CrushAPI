const express = require('express')
const multer = require('multer')

const router = express.Router()

const getConnection = require('./connection');
const userShcema = require('./userSchema')
const dataBase = new getConnection();

// Update avatar route
router.post("/update/", async (req, res) => {
    console.log(req.file);

    res.status(201).json({ message: "Update realizado com sucesso" })
})

module.exports = router;