import express from "express"
import bcrypt from "bcrypt";
import userSchema from "./userSchema.js"
import getConnection from "./connection.js";
import jwt from 'jsonwebtoken'

const router = express.Router()
const dataBase = new getConnection();

router.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password || nickname === "" || password === "") {
      return res.status(400).json({ message: "Campo faltando", logged: false });
    }

    await dataBase.connect();

    const userFinded = await userSchema.findOne({ nickname });
        
    if (!userFinded) {
      return res.status(400).json({ message: "Nickname não encontrado", logged: false });
    }

    const comparePassword = await bcrypt.compare(password, userFinded.password);

    if (!comparePassword) {
      return res.status(400).json({ message: "Senha incorreta tente novamente", logged: false });
    }

    const token = jwt.sign({ user: userFinded }, process.env.JWT_SECRET, { expiresIn: '8h' });

    return res.status(200).json({ message: 'Autenticado com sucesso', token });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ message: "Erro interno. Por favor, tente novamente" });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { nickname, email, password, birthdaydata, campus } = req.body;

    if (!email || !nickname || !password || !birthdaydata || !campus) {
      return res.status(400).send({ message: "Preencha todos os campos" });
    }

    await dataBase.connect();

    const existingUser = await userSchema.findOne({ $or: [{ email }, { nickname }] });

    if (existingUser != null) {
      if (existingUser.nickname == nickname) {
        return res.status(400).send({ message: "Nickname já está em uso. Por favor, escolha outro." });
      }
      if (existingUser.email == email) {
        return res.status(400).send({ message: "Email já está em uso" })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userSchema({
      nickname,
      email,
      password: hashedPassword,
      birthdaydata,
      campus
    });

    await newUser.save();

    return res.status(201).json({ message: "Usuário cadastrado com sucesso", isRegistered: true, user: newUser });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).send({ message: "Erro interno. Por favor, tente novamente." });
  }
});

export default router