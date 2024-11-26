import { Readable } from "stream";
import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";

// Local Imports
import cloudinary from "./cloudinary.js";
import userSchema from "./userSchema.js";
import postSchema from "./postSchema.js";
import getConnection from "./connection.js";
import Comment from "./commentSchema.js";

const router = express.Router();
const dataBase = new getConnection();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const extractHashtagsAndMentions = async (content) => {
  const hashtags = content.match(/#[\w]+/g) || [];
  const mentions = content.match(/@[\w]+/g) || [];

  const hashtagsList = hashtags.map((tag) => tag.slice(1));

  const mentionedUsers = [];
  for (const mention of mentions) {
    const userName = mention.slice(1);
    const user = await userSchema.findOne({ nickname: userName });
    if (user) {
      mentionedUsers.push(user._id);
    }
  }

  return { hashtags: hashtagsList, mentionedUsers };
};

router.post("/publish/:token", upload.array("photos", 5), async (req, res) => {
  try {
    const token = req.params.token;
    const { content, isAnonymous } = req.body;
    const photos = req.files;

    if (!content) {
      return res
        .status(400)
        .json({ message: "Insira um conteúdo na publicação" });
    }

    if (isAnonymous !== "true" && isAnonymous !== "false") {
      return res
        .status(400)
        .json({ message: "É necessário definir o tipo da postagem" });
    }

    if (!token) {
      return res
        .status(400)
        .json({ message: "É necessário passar o id do usuário para postagem" });
    }

    await dataBase.connect();

    const decodedObj = jwt.decode(token, process.env.JWT_SECRET);
    const userFound = await userSchema.findOne({ _id: decodedObj.user._id });

    // Extrair hashtags e menções do conteúdo
    const { hashtags, mentionedUsers } = await extractHashtagsAndMentions(
      content
    );

    const savePost = async (photoURLs = null) => {
      const postToSave = {
        content,
        isAnonymous,
        photoURLs,
        userId: decodedObj.user._id,
        hashtags,
        mentionedUsers,
      };

      await postSchema.create(postToSave);

      return res
        .status(200)
        .json({ message: "Dados recebidos com sucesso!", posted: true });
    };

    // Verificar se a foto foi enviada
    if (photos && photos.length > 0) {
      const photoURLs = [];

      const uploadPromises = photos.map((photo) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "posts" },
            (error, result) => {
              if (error) {
                console.error("Erro ao realizar upload da imagem:", error);
                reject(error);
              } else {
                resolve(result.url);
              }
            }
          );

          const readablePhotoStream = new Readable();
          readablePhotoStream.push(photo.buffer);
          readablePhotoStream.push(null);
          readablePhotoStream.pipe(uploadStream);
        });
      });

      try {
        const uploadedURLs = await Promise.all(uploadPromises);
        photoURLs.push(...uploadedURLs);
        savePost(photoURLs);
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Erro ao realizar upload das imagens" });
      }
    } else {
      savePost([]);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
});

router.get("/get/:token/:skip/:limit", async (req, res) => {
  const { token, skip, limit } = req.params;

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

  if (!skip || isNaN(skip)) {
    return res
      .status(400)
      .json({ message: "É necessário repassar um skip válido" });
  }
  if (!limit || isNaN(limit)) {
    return res
      .status(400)
      .json({ message: "É necessário repassar um limit válido" });
  }
  if (!token) {
    return res.status(400).json({
      message: "É necessário repassar um token válido para busca",
      validToken: false,
    });
  }

  try {
    await dataBase.connect();

    const skipValue = parseInt(skip);
    const limitValue = parseInt(limit);

    const posts = await postSchema
      .find()
      .sort({ insertAt: -1 })
      .skip(skipValue)
      .limit(limitValue);

    if (!posts) {
      return res.status(500).json({
        message: "Ocorreu um erro ao recuperar os posts. Tente novamente.",
      });
    }

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Erro ao recuperar posts:", error);
    return res.status(500).json({
      message: "Ocorreu um erro ao recuperar os posts. Tente novamente.",
    });
  } finally {
  }
});

router.get("/get/user/:userId/:skip/:limit", async (req, res) => {
  const { userId, skip, limit } = req.params;

  let decodedObj;

  if (!userId) {
    return res
      .status(400)
      .json({ message: "É necessário repassar um userId válido" });
  }
  if (!skip || isNaN(skip)) {
    return res
      .status(400)
      .json({ message: "É necessário repassar um skip válido" });
  }
  if (!limit || isNaN(limit)) {
    return res
      .status(400)
      .json({ message: "É necessário repassar um limit válido" });
  }

  try {
    await dataBase.connect();

    const skipValue = parseInt(skip);
    const limitValue = parseInt(limit);

    const posts = await postSchema
      .find({ userId, isAnonymous: false })
      .sort({ insertAt: -1 })
      .skip(skipValue)
      .limit(limitValue);

    if (!posts.length) {
      return res.status(404).json({
        message: "Nenhuma postagem encontrada.",
      });
    }

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Erro ao recuperar posts:", error);
    return res.status(500).json({
      message: "Ocorreu um erro ao recuperar os posts. Tente novamente.",
    });
  } finally {
  }
});

router.get("/id/:id", async (req, res) => {
  try {
    const queryId = req.params.id;

    if (!queryId) {
      return res.status(400).json({ message: "ID não especificado" });
    }

    await dataBase.connect();

    // Busca o post pelo _id
    const postFinded = await postSchema.findOne({ _id: queryId });

    if (!postFinded) {
      return res.status(404).json({
        message: "Post não encontrado",
        nickname: "Deletado",
        email: "Deletado",
        campus: "Deletado",
        references: "Deletado",
        content: "Deletado",
        isAnonymous: false,
        photoURLs: "Deletado",
        userAvatar: "Deletado",
        userId: "Deletado",
        likeCount: 0,
      });
    }

    return res.status(200).json({ postFinded });
  } catch (error) {
    console.error("Erro ao buscar post:", error);
    return res.status(500).json({ message: "Erro ao buscar post", error });
  }
});

router.post("/like", async (req, res) => {
  const { token, postId } = req.body;

  try {
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const post = await postSchema.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post não encontrado", found: false });
    }

    if (post.likedBy.includes(decodedObj.user._id)) {
      return res
        .status(400)
        .json({ message: "Você já curtiu esse post", alreadyLiked: true });
    }

    post.likedBy.push(decodedObj.user._id);
    post.likeCount += 1;
    await post.save();

    return res.status(200).json({
      message: "Post curtido com sucesso",
      likeCount: post.likeCount,
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
  const { token, postId } = req.body;

  try {
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const post = await postSchema.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post não encontrado", found: false });
    }

    if (!post.likedBy.includes(decodedObj.user._id)) {
      return res
        .status(400)
        .json({ message: "Você ainda não curtiu esse post", notLiked: true });
    }

    post.likedBy = post.likedBy.filter(
      (userId) => userId.toString() !== decodedObj.user._id.toString()
    );
    post.likeCount = Math.max(post.likeCount - 1, 0);
    await post.save();

    return res.status(200).json({
      message: "Like removido com sucesso",
      likeCount: post.likeCount,
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

router.get("/saved/:token/:skip/:limit", async (req, res) => {
  const { token, skip, limit } = req.params;

  try {
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    await dataBase.connect();

    const likedPosts = await postSchema
      .find({ likedBy: decodedObj.user._id })
      .sort({ insertAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(parseInt(limit, 10));

    if (!likedPosts || likedPosts.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhum post curtido encontrado." });
    }

    return res.status(200).json({ likedPosts });
  } catch (error) {
    console.error("Erro ao buscar posts curtidos:", error);

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

router.delete("/deletePost", async (req, res) => {
  try {
    
    const { token, postId } = req.body;
    
    
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

    const post = await postSchema.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post não encontrado" });
    }
    
    await Comment.deleteMany({ _id: { $in: post.comments } });

    // Delete o post
    await postSchema.findByIdAndDelete(postId);

    return res
      .status(200)
      .json({ message: "Post e comentários deletados com sucesso", deleted: true });
  } catch (error) {
    console.error("Erro ao deletar post e comentários:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});

export default router;
