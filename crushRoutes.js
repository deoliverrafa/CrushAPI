import express from "express";
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

router.post("/like", async (req, res) => {
  const { userId, likedUserId } = req.body;

  try {
    await dataBase.connect();

    const user = await userSchema.findByIdAndUpdate(
      userId,
      { $addToSet: { likedUsers: likedUserId } },
      { new: true }
    );

    res.status(200).json({ message: "Usuário curtido com sucesso!", user });
  } catch (error) {
    console.error("Erro ao curtir o usuário:", error);
    res.status(500).json({ message: "Erro ao curtir o usuário." });
  }
});

router.post("/liked", async (req, res) => {
  const { userId } = req.body;

  try {
    await dataBase.connect();

    const likedByUsers = await userSchema.find(
      { likedUsers: userId },
      { password: 0 }
    );

    res.status(200).json(likedByUsers);
  } catch (error) {
    console.error("Erro ao buscar usuários que curtiram:", error);
    res.status(500).json({ message: "Erro ao buscar usuários que curtiram." });
  }
});

router.post("/matches", async (req, res) => {
  const { userId } = req.body;

  try {
    await dataBase.connect();

    const user = await userSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const matches = await userSchema.find({
      _id: { $in: user.likedUsers },
      likedUsers: userId,
    }, { password: 0 });

    res.status(200).json({
      message: "Matches encontrados com sucesso!",
      matches,
    });
  } catch (error) {
    console.error("Erro ao buscar matches:", error);
    res.status(500).json({ message: "Erro ao buscar matches." });
  }
});

export default router;
