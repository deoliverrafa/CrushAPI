import express from "express";
import axios from "axios";
import bcrypt from "bcrypt";
import userSchema from "../schemas/userSchema.js";
import getConnection from "../utils/connection.js";
import jwt from "jsonwebtoken";
import generateVerificationToken from "../utils/generateVerificationToken.js";
import { sendVerificationEmail } from "../utils/sendEmailVerification.js";

const router = express.Router();
const dataBase = new getConnection();

router.post("/login", async (req, res) => {
  try {
    const { nickname, password, captcha } = req.body;

    if (!nickname || !password) {
      return res
        .status(400)
        .json({ message: "Preencha todos os campos.", logged: false });
    }

    if (!captcha) {
      return res
        .status(400)
        .json({ message: "CAPTCHA não preenchido.", logged: false });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const captchaVerification = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      { params: { secret: secretKey, response: captcha } }
    );

    if (!captchaVerification.data.success) {
      return res
        .status(400)
        .json({ message: "Falha na verificação do CAPTCHA.", logged: false });
    }

    await dataBase.connect();

    // Buscar usuário por nickname ou e-mail
    const userFinded = await userSchema.findOne({
      $or: [{ nickname }, { email: nickname }],
    });

    if (!userFinded) {
      return res
        .status(400)
        .json({ message: "Usuário ou e-mail não encontrado.", logged: false });
    }

    // Bloquear login se o e-mail não estiver verificado
    if (!userFinded.emailVerified) {
      return res.status(403).json({
        message: "E-mail ainda não verificado. Verifique seu e-mail para prosseguir.",
        logged: false,
      });
    }

    // Verificar senha
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
      emailVerified: false,
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
    // Procure o usuário pelo token e verifique se ele não expirou
    await dataBase.connect();
    const user = await userSchema.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido ou expirado." });
    }

    // Atualize o campo emailVerified e limpe os dados de verificação
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({ message: "E-mail verificado com sucesso!" });
  } catch (error) {
    console.error("Erro ao verificar e-mail:", error);
    res.status(500).json({ message: "Erro interno ao verificar o e-mail." });
  }
});

export default router;
