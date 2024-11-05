import express from "express";
import mongoose from "mongoose";
import getConnection from "./connection.js";
import userSchema from "./userSchema.js";

const router = express.Router();
const dataBase = new getConnection();

router.get("/users", async (req, res) => {
  const { gender, userId } = req.body; 

  try {
    await dataBase.connect();

    const filter = { _id: { $ne: userId } };

    if (gender && gender !== "Todos") {
      filter.gender = gender;
    }

    const usuarios = await userSchema.find(filter, { password: 0 });

    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

export default router;
