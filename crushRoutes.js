import express from "express";
import getConnection from "./connection.js";

import userSchema from "./userSchema.js";

const router = express.Router();
const dataBase = new getConnection();

router.get("/users", async (req, res) => {
  try {
    await dataBase.connect();

    const usuarios = await userSchema.find({}, { password: 0 });

    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

export default router;
