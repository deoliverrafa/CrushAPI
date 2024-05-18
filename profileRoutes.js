import express from "express";
import multer from "multer";

const router = express.Router()

import getConnection from "./connection.js";
import userSchema from "./userSchema.js"

const dataBase = new getConnection();

router.post("/updatePhoto", multer().single('avatar'), async (req, res) => {
    console.log(req.file);

    res.status(201).json({ message: "Update realizado com sucesso" })
})

export default router;