const express = require('express')
const router = express.Router()

const getConnection = require('./connection');
const userShcema = require('./userSchema')
const dataBase = new getConnection();
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
    try {

        const { nickname, password } = req.body;

        if (!nickname || !password) {
            return res.status(400).json({ message: "Campo faltando", logged: false });
        }

        await dataBase.connect();

        const userFinded = await userShcema.findOne({ nickname });

        if (!userFinded) {
            return res.status(400).json({ message: "Nickname não encontrado", logged: false });
        }

        const comparePassword = await bcrypt.compare(password, userFinded.password);

        if (!comparePassword) {
            return res.status(400).json({ message: "Senha incorreta tente novamente", logged: false });
        }

        res.status(202).json({ message: "Logado", logged: true, user: userFinded });

    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ message: "Erro interno. Por favor, tente novamente" });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { nickname, email, password, birthdaydata, campus } = req.body;

        if (!email || !nickname || !password || !birthdaydata || !campus) {
            return res.status(400).send({ message: "Preencha todos os campos" });
        }

        await dataBase.connect();

        // Verificar se já existe um usuário com o mesmo nickname
        const existingUser = await userShcema.findOne({ $or: [{ email }, { nickname }] });

        if (existingUser.nickname == nickname) {
            return res.status(400).send({ message: "Nickname já está em uso. Por favor, escolha outro." });
        }

        if (existingUser.email == email) {
            return res.status(400).send({message: "Email já está em uso"})
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar um novo usuário com a senha criptografada
        const newUser = new userShcema({
            nickname,
            email,
            password: hashedPassword,
            birthdaydata,
            campus
        });

        await newUser.save();

        res.status(201).json({ message: "Usuário cadastrado com sucesso", isRegistered: true, user: newUser });
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        res.status(500).send({ message: "Erro interno. Por favor, tente novamente." });
    }
});

module.exports = router;