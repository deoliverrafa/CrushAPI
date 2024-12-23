import express from "express";
import getConnection from "../utils/connection.js";
import userSchema from "../schemas/userSchema.js";
import postSchema from "../schemas/postSchema.js";
import commentSchema from "../schemas/commentSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();
const dataBase = new getConnection();

router.get("/token/:token", async (req, res) => {
  try {
    const token = req.params.token;

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token" });
    }

    let decodedObj;

    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res
          .status(403)
          .json({ message: "Token Expirado", validToken: false });
      }
      return res
        .status(403)
        .json({ message: "Token Inválido", validToken: false });
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
        nickname: "Deletado",
        campus: "Deletado",
        email: "Deletado",
        status: "Deletado",
        avatar: "",
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
      return res
        .status(400)
        .json({ message: "É preciso especificar um token" });
    }

    let decodedObj;

    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res
          .status(403)
          .json({ message: "Token Expirado", validToken: false })
          .redirect("/");
      }
      return res
        .status(403)
        .json({ message: "Token Inválido", validToken: false });
    }

    if (!nickname) {
      return res.status(400).json({ message: "ID não especificado" });
    }

    // Conecta ao banco de dados
    await dataBase.connect();

    // Busca o usuário pelo nickname
    const usersFinded = await userSchema.find({
      nickname: { $regex: nickname, $options: "i" },
    });

    if (!usersFinded) {
      return res.status(404).json({
        message: "Usuário não encontrado",
        nickname: "Deletado",
        campus: "Deletado",
        email: "Deletado",
        avatar: "",
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
      return res
        .status(400)
        .json({ message: "É preciso especificar um token" });
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res
          .status(403)
          .json({ message: "Token Expirado", validToken: false });
      }
      return res
        .status(403)
        .json({ message: "Token Inválido", validToken: false });
    }

    if (!userFollowId) {
      return res
        .status(400)
        .json({ message: "ID do usuário a seguir não especificado" });
    }

    if (decodedObj.user._id == userFollowId) {
      return res
        .status(403)
        .json({ message: "Você não pode seguir a si mesmo" });
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
      return res
        .status(404)
        .json({ message: "Erro ao seguir usuário, verifique os IDs" });
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

router.put("/unfollow", async (req, res) => {
  try {
    const { token, unfollowId } = req.body;
  
    if (!token) {
      return res.status(403).json({ message: "Sua sessão expirou" });
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res
          .status(403)
          .json({ message: "Token Expirado", validToken: false })
          .redirect("/");
      }
      return res
        .status(403)
        .json({ message: "Token Inválido", validToken: false });
    }

    if (!unfollowId) {
      return res
        .status(400)
        .json({ message: "ID do usuário a seguir não especificado" });
    }

    if (decodedObj.user._id == unfollowId) {
      return res
        .status(403)
        .json({ message: "Você não pode deixar de seguir a si mesmo" });
    }

    await dataBase.connect();

    const updatedUser = await userSchema.findByIdAndUpdate(
      decodedObj.user._id,
      {
        $pull: { following: unfollowId },
        $inc: { Nfollowing: -1 },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(500)
        .json({ message: "Erro ao deixar de seguir usuário" });
    } 
    

    const updatedUnfollowUser = await userSchema.findByIdAndUpdate(
      unfollowId,
      {
        $pull: { followers: decodedObj.user._id },
        $inc: { Nfollowers: -1 },
      },
      { new: true }
    );

    if (!updatedUnfollowUser) {
      return res
        .status(500)
        .json({ message: "Erro ao deixar de seguir usuário" });
    }

    return res.status(200).json({
      message: "Deixou de seguir",
      unfollowed: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Algo deu errado no servidor" });
  }
});

router.get("/following/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um ID de usuário" });
    }

    // Conecta ao banco de dados
    await dataBase.connect();

    const user = await userSchema
      .findById(userId)
      .populate([
        { path: "following", select: "nickname avatar userName type status following followers" },
      ]);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res.status(200).json({
      following: user.following,
    });
  } catch (error) {
    console.error("Erro ao obter usuários seguidos:", error);
    return res.status(500).json({ message: "Erro ao obter dados", error });
  }
});

router.get("/followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um ID de usuário" });
    }

    // Conecta ao banco de dados
    await dataBase.connect();

    const user = await userSchema
      .findById(userId)
      .populate([
        { path: "followers", select: "nickname avatar userName type status" },
      ]);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res.status(200).json({
      followers: user.followers,
    });
  } catch (error) {
    console.error("Erro ao obter usuários seguidos:", error);
    return res.status(500).json({ message: "Erro ao obter dados", error });
  }
});

router.put("/status/:id", async (req, res) => {
  try {
    const queryId = req.params.id;
    const { status } = req.body; // Esperando um corpo com o novo status

    if (!queryId || !status) {
      return res.status(400).json({ message: "ID ou status não especificado" });
    }

    // Verifica se o status é válido
    const validStatuses = ["online", "offline", "away"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    // Conecta ao banco de dados
    await dataBase.connect();

    // Atualiza o status do usuário
    const updatedUser = await userSchema.findByIdAndUpdate(
      queryId,
      { status },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res
      .status(200)
      .json({ message: "Status atualizado com sucesso", updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return res.status(500).json({ message: "Erro ao atualizar status", error });
  }
});

router.post("/like", async (req, res) => {
  const { token, userId } = req.body;

  try {
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const user = await userSchema.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Usuário não encontrado", found: false });
    }

    if (user.likedBy.includes(decodedObj.user._id)) {
      return res
        .status(400)
        .json({ message: "Você já curtiu esse usuário", alreadyLiked: true });
    }

    user.likedBy.push(decodedObj.user._id);
    user.likeCount += 1;
    await user.save();

    return res.status(200).json({
      message: "Usuário curtido com sucesso",
      likeCount: user.likeCount,
      liked: true,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(403)
        .json({ message: "Token Expirado", validToken: false });
    }
    return res
      .status(403)
      .json({ message: "Token Inválido", validToken: false });
  }
});

router.post("/unlike", async (req, res) => {
  const { token, userId } = req.body;

  try {
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const user = await userSchema.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Usuário não encontrado", found: false });
    }

    if (!user.likedBy.includes(decodedObj.user._id)) {
      return res.status(400).json({
        message: "Você ainda não curtiu esse usuário",
        notLiked: true,
      });
    }

    user.likedBy = user.likedBy.filter(
      (userId) => userId.toString() !== decodedObj.user._id.toString()
    );
    user.likeCount = Math.max(user.likeCount - 1, 0);
    await user.save();

    return res.status(200).json({
      message: "Like removido com sucesso",
      likeCount: user.likeCount,
      unLiked: true,
    });
  } catch (error) {
    console.error("Erro capturado:", error);

    if (error.name === "TokenExpiredError") {
      return res
        .status(403)
        .json({ message: "Token Expirado", validToken: false });
    }
    return res
      .status(403)
      .json({ message: "Token Inválido", validToken: false });
  }
});

router.get("/suggestions/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token" });
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(403)
          .json({ message: "Token Expirado", validToken: false });
      }
      return res
        .status(403)
        .json({ message: "Token Inválido", validToken: false });
    }

    await dataBase.connect();

    const currentUser = await userSchema.findById(decodedObj.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const suggestions = await userSchema
      .find({
        _id: { $nin: [decodedObj.user._id, ...currentUser.following] },
      })
      .limit(100); // Limita o número de sugestões

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Erro ao buscar sugestões:", error);
    return res.status(500).json({ message: "Erro ao buscar sugestões", error });
  }
});

router.delete("/deleteAccount", async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token é necessário" });
    }

    let decodedObj;
    try {
      decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).json({ message: "Token Inválido ou Expirado" });
    }

    await dataBase.connect();
    const user = await userSchema.findById(decodedObj.user._id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Senha incorreta" });
    }

    const userId = decodedObj.user._id;

    await postSchema.updateMany(
      { likedBy: userId },
      { $pull: { likedBy: userId }, $inc: { likeCount: -1 } }
    );
    await postSchema.updateMany(
      { "comments.userId": userId },
      { $pull: { comments: { userId: userId } }, $inc: { commentCount: -1 } }
    );
    await postSchema.updateMany(
      { mentionedUsers: userId },
      { $pull: { mentionedUsers: userId } }
    );

    await commentSchema.updateMany(
      { likedBy: userId },
      { $pull: { likedBy: userId }, $inc: { likeCount: -1 } }
    );
    await commentSchema.updateMany(
      { "replies.userId": userId },
      { $pull: { replies: { userId: userId } } }
    );
    await commentSchema.updateMany(
      { mentionedUsers: userId },
      { $pull: { mentionedUsers: userId } }
    );

    await postSchema.deleteMany({ userId: userId });
    await commentSchema.deleteMany({ userId: userId });
    await userSchema.findByIdAndDelete(userId);

    return res.status(200).json({ message: "Conta excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return res.status(500).json({ message: "Erro ao excluir conta", error });
  }
});

export default router;
