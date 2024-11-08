import express from "express";
import bcrypt from "bcrypt";
import userSchema from "./userSchema.js";
import getConnection from "./connection.js";
import jwt from "jsonwebtoken";
import generateVerificationToken from "./generateVerificationToken.js";
import { sendVerificationEmail } from "./sendEmailVerification.js";

const router = express.Router();
const dataBase = new getConnection();

router.post("/login", async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password || nickname === "" || password === "") {
      return res
        .status(400)
        .json({ message: "Preencha todos os campos.", logged: false });
    }

    await dataBase.connect();

    const userFinded = await userSchema.findOne({ nickname });

    if (!userFinded) {
      return res
        .status(400)
        .json({ message: "Nickname não encontrado.", logged: false });
    }

    const comparePassword = await bcrypt.compare(password, userFinded.password);

    if (!comparePassword) {
      return res
        .status(400)
        .json({ message: "Senha incorreta, tente novamente.", logged: false });
    }
    const { password: _, ...userWithoutPassword } = userFinded.toObject();

    const token = jwt.sign(
      { user: userWithoutPassword },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      message: "Autenticado com sucesso!",
      token,
      logged: true,
      userId: userFinded._id,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res
      .status(500)
      .json({ message: "Erro interno. Por favor, tente novamente." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { nickname, email, password, userName, type } = req.body;

    if (!email || !nickname || !password || !userName) {
      return res.status(400).send({ message: "Preencha todos os campos." });
    }

    await dataBase.connect();

    const existingUser = await userSchema.findOne({
      $or: [{ email }, { nickname }],
    });

    if (existingUser != null) {
      if (existingUser.nickname == nickname) {
        return res.status(400).send({
          message: "Nickname já está em uso. Por favor, escolha outro.",
        });
      }
      if (existingUser.email == email) {
        return res.status(400).send({ message: "E-mail já está em uso." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userSchema({
      nickname,
      email,
      password: hashedPassword,
      userName,
      type,
    });

    await newUser.save();

    const token = generateVerificationToken();
    newUser.emailVerificationToken = token;
    newUser.emailVerificationExpires = Date.now() + 3600000; // 1 hora a partir de agora
    await newUser.save();

    // Envie o e-mail de verificação
    await sendVerificationEmail(newUser.email, token);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso! Verifique seu e-mail.",
      isRegistered: true,
      user: newUser,
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res
      .status(500)
      .send({ message: "Erro interno. Por favor, tente novamente." });
  }
});

router.get("/email", async (req, res) => {
  try {
    await dataBase.connect();
    console.log(req.query);
    
    const user = await userSchema.findOne({ email: req.query.email });

    if (!user) {
      return res.status(404).send("Usuário não encontrado");
    }

    // Gere o token e configure o tempo de expiração
    const token = generateVerificationToken();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 hora a partir de agora
    await user.save();

    // Envie o e-mail de verificação
    await sendVerificationEmail(user.email, token);

    res.send("E-mail de verificação enviado com sucesso!");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(`Erro ao enviar o e-mail de verificação para ${req.query.email} `);
  }
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  try {
    // Procure o usuário pelo token e verifique se o token ainda está válido
    await dataBase.connect();
    const user = await userSchema.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Token inválido ou expirado.");
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.send("E-mail verificado com sucesso!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao verificar o e-mail.");
  }
});

export default router;
