import getConnection from "./connection.js";
import postSchema from "./postSchema.js";
import commentSchema from "./commentSchema.js";

import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();
const dataBase = new getConnection();

router.post("/comment", async (req, res) => {
  try {
    const { content, postId, token, userId } = req.body;

    jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const post = await postSchema.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Postagem não encontrada ou deletada",
        posted: false,
      });
    }

    const newComment = await commentSchema.create({
      userId: userId,
      content,
    });

    post.comments.push(newComment._id);
    post.commentCount = post.comments.length;

    await post.save();

    return res
      .status(200)
      .json({ message: "Postado", posted: true, commentId: newComment._id });
  } catch (error) {
    console.error("Erro capturado:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        message: "Token Expirado",
        validToken: false,
        posted: false,
        error,
      });
    }
    return res.status(403).json({
      message: "Token Inválido",
      validToken: false,
      posted: false,
      error,
    });
  }
});

router.get("/getComment/:token/:postId", async (req, res) => {
  try {
    const { token, postId } = req.params;
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    jwt.verify(token, process.env.JWT_SECRET);

    const post = await postSchema.findById(postId).populate({
      path: "comments",
      options: {
        skip: skip,
        limit: limit,
        sort: { insertAt: -1 },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado" });
    }

    return res.status(200).json({ comments: post.comments });
  } catch (error) {
    console.error("Erro capturado:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        message: "Token Expirado",
        validToken: false,
        posted: false,
        error,
      });
    }
    return res.status(403).json({
      message: "Token Inválido",
      validToken: false,
      posted: false,
      error,
    });
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

    // Busca o post pelo _id
    const commentFinded = await commentSchema.findOne({ _id: queryId });

    if (!commentFinded) {
      return res.status(404).json({
        content: "Deletado",
        userId: "Deletado",
        likeCount: 0,
      });
    }

    return res.status(200).json({ commentFinded });
  } catch (error) {
    console.error("Erro ao buscar comment:", error);
    return res.status(500).json({ message: "Erro ao buscar comment", error });
  }
});

router.post("/like", async (req, res) => {
  const { token, commentId } = req.body;

  try {
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const comment = await commentSchema.findById(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comentário não encontrado", found: false });
    }

    if (comment.likedBy.includes(decodedObj.user._id)) {
      return res.status(400).json({
        message: "Você já curtiu esse comentário",
        alreadyLiked: true,
      });
    }

    comment.likedBy.push(decodedObj.user._id);
    comment.likeCount += 1;
    await comment.save();

    return res.status(200).json({
      message: "Comentário curtido com sucesso",
      likeCount: comment.likeCount,
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
  const { token, commentId } = req.body;

  try {
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const comment = await commentSchema.findById(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comentário não encontrado", found: false });
    }

    if (!comment.likedBy.includes(decodedObj.user._id)) {
      return res.status(400).json({
        message: "Você ainda não curtiu esse comentário",
        notLiked: true,
      });
    }

    comment.likedBy = comment.likedBy.filter(
      (userId) => userId.toString() !== decodedObj.user._id.toString()
    );
    comment.likeCount = Math.max(comment.likeCount - 1, 0);
    await comment.save();

    return res.status(200).json({
      message: "Like removido com sucesso",
      likeCount: comment.likeCount,
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

export default router;
