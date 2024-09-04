import express, { json } from 'express';
import getConnection from './connection.js';
import userSchema from './userSchema.js';
import jwt from 'jsonwebtoken'

const router = express.Router();
const dataBase = new getConnection();

router.get("/token/:token", async (req, res) => {
    try {
        const token = req.params.token;

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token" });
        }

        let decodedObj;

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: 'Token Expirado', validToken: false });
            }
            return res.status(403).json({ message: 'Token Inválido', validToken: false });
        }

        await dataBase.connect();

        const userFinded = await userSchema.findOne({ _id: decodedObj.user._id });

        if (!userFinded) {
            return res.status(400).json({ message: "Usuário não encontrado" });
        }

        return res.status(200).json({ userFinded });

    } catch (error) {
        return res.status(500).json({ error });
    }
});

router.get("/id/:id", async (req, res) => {
    try {
        const queryId = req.params.id;

        if (!queryId) {
            return res.status(400).json({ message: "ID não especificado" });
        }

        // Conecta ao banco de dados
        await dataBase.connect();

        // Busca o usuário pelo _id
        const userFinded = await userSchema.findOne({ _id: queryId });

        if (!userFinded) {
            return res.status(404).json({
                message: "Usuário não encontrado",
                nickname: 'Deletado',
                campus: 'Deletado',
                email: 'Deletado',
                avatar: ''
            });
        }

        return res.status(200).json({ userFinded });

    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        return res.status(500).json({ message: "Erro ao buscar usuário", error });
    }
});

router.post("/getByName", async (req, res) => {
    try {
        const { nickname, token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token" });
        }

        let decodedObj

        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: 'Token Expirado', validToken: false }).redirect('/');
            }
            return res.status(403).json({ message: 'Token Inválido', validToken: false });
        }

        if (!nickname) {
            return res.status(400).json({ message: "ID não especificado" });
        }

        // Conecta ao banco de dados
        await dataBase.connect();

        // Busca o usuário pelo nickname
        const usersFinded = await userSchema.find({ nickname: { $regex: nickname, $options: "i" } });

        if (!usersFinded) {
            return res.status(404).json({
                message: "Usuário não encontrado",
                nickname: 'Deletado',
                campus: 'Deletado',
                email: 'Deletado',
                avatar: ''
            });
        }

        return res.status(200).json({ usersFinded });

    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        return res.status(500).json({ message: "Erro ao buscar usuário", error });
    }
});

router.put("/follow", async (req, res) => {
    try {
        const { userFollowId, token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "É preciso especificar um token" });
        }

        let decodedObj;
        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: "Token Expirado", validToken: false }).redirect("/");
            }
            return res.status(403).json({ message: "Token Inválido", validToken: false });
        }

        if (!userFollowId) {
            return res.status(400).json({ message: "ID do usuário a seguir não especificado" });
        }

        if (decodedObj.user._id == userFollowId) {
            return res.status(403).json({ message: "Você não pode seguir a si mesmo" })
        }

        // Conecta ao banco de dados
        await dataBase.connect();

        // Atualiza o usuário logado, adicionando o userFollowId ao array de following
        const updatedUser = await userSchema.findByIdAndUpdate(
            decodedObj.user._id,
            {
                $addToSet: { following: userFollowId },
                $inc: { Nfollowing: 1 },
            },
            { new: true }
        );

        // Atualiza o usuário que está sendo seguido, adicionando o usuário logado ao array de followers
        const updatedFollowUser = await userSchema.findByIdAndUpdate(
            userFollowId,
            {
                $addToSet: { followers: decodedObj.user._id },
                $inc: { Nfollowers: 1 },
            },
            { new: true }
        );

        if (!updatedUser || !updatedFollowUser) {
            return res.status(404).json({ message: "Erro ao seguir usuário, verifique os IDs" });
        }

        return res.status(200).json({
            message: "Usuário seguido com sucesso",
            followed: true,
        });
    } catch (error) {
        console.error("Erro ao seguir usuário:", error);
        return res.status(500).json({ message: "Erro ao seguir usuário", error });
    }
});

router.delete(("/unfollow"), async (req, res) => {
    try {

        const { token, unfollowId } = req.body

        if (!token) {
            return res.status(403).json({ message: "Sua sessão expirou" })
        }

        let decodedObj;
        try {
            decodedObj = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name == "TokenExpiredError") {
                return res.status(403).json({ message: "Token Expirado", validToken: false }).redirect("/");
            }
            return res.status(403).json({ message: "Token Inválido", validToken: false });
        }

        if (!unfollowId) {
            return res.status(400).json({ message: "ID do usuário a seguir não especificado" });
        }

        if (decodedObj.user._id == unfollowId) {
            return res.status(403).json({ message: "Você não pode deixar de seguir a si mesmo" })
        }

        await dataBase.connect()

        const updatedUser = userSchema.findByIdAndUpdate(
            decodedObj.user._id,
            {
                $pull: { following: unfollowId },
                $inc: { Nfollowing: -1 },
            },
            { new: true }
        )

        if (!updatedUser) {
            return res.status(500).json({ message: "Erro ao deixar de seguir usuário" })
        }

        const updatedUnfollowUser = userSchema.findByIdAndUpdate(
            unfollowId,
            {
                $pull: { followers: decodedObj.user._id },
                $inc: { Nfollowers: -1 },
            },
            { new: true }
        )

        if (!updatedUnfollowUser) {
            return res.status(500).json({ message: "Erro ao deixar de seguir usuário" })
        }

        return res.status(200).json({
            message: "Deixou de seguir",
            unfollowed: true,
        })

    } catch (error) {
        return res.status(500).json({ message: "Algo deu errado no servidor" })
    }
})


export default router;