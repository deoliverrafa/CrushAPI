import express from "express";
import multer from "multer";
import { Readable } from "stream";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

import getConnection from "./connection.js";
import userSchema from "./userSchema.js";
import cloudinary from "./cloudinary.js";

const dataBase = new getConnection();

router.post("/updatePhoto", multer().single("avatar"), async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token", validToken: false });
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

    const photo = req.file;

    if (!photo) {
      return res.status(400).json({
        message: "É necessário selecionar uma imagem para upload do avatar",
      });
    }

    const validMimeTypes = ["image/png", "image/jpeg", "image/gif"];
    if (!validMimeTypes.includes(photo.mimetype)) {
      return res.status(400).json({ message: "Insira uma imagem válida" });
    }

    await dataBase.connect();

    const userFound = await userSchema.findOne({ _id: decodedObj.user._id });

    if (!userFound) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "avatar" },
      async (error, result) => {
        if (error) {
          console.log("Erro ao realizar upload de imagem", error);
          return res
            .status(500)
            .json({ message: "Erro ao realizar upload de imagem" });
        }

        // Atualizar o URL da foto do usuário no banco de dados
        userFound.avatar = result.secure_url;
        await userFound.save();

        return res.status(201).json({
          message: "Update realizado com sucesso",
          avatarURL: result.secure_url,
          updated: true,
        });
      }
    );

    const readablePhotoStream = new Readable();
    readablePhotoStream.push(photo.buffer);
    readablePhotoStream.push(null);
    readablePhotoStream.pipe(uploadStream);
  } catch (error) {
    console.error("Erro ao atualizar foto", error);
    return res.status(500).json({ message: "Erro ao atualizar foto", error });
  }
});

router.post("/updateBanner", multer().single("banner"), async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token", validToken: false });
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

    const banner = req.file;

    if (!banner) {
      return res.status(400).json({
        message: "É necessário selecionar uma imagem para upload do banner",
      });
    }

    const validMimeTypes = ["image/png", "image/jpeg", "image/gif"];
    if (!validMimeTypes.includes(banner.mimetype)) {
      return res.status(400).json({ message: "Insira uma imagem válida" });
    }

    await dataBase.connect();

    const userFound = await userSchema.findOne({ _id: decodedObj.user._id });

    if (!userFound) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "banner" },
      async (error, result) => {
        if (error) {
          console.log("Erro ao realizar upload de imagem", error);
          return res
            .status(500)
            .json({ message: "Erro ao realizar upload de imagem" });
        }

        // Atualizar o URL do banner do usuário no banco de dados
        userFound.banner = result.secure_url;
        await userFound.save();

        return res.status(201).json({
          message: "Banner atualizado com sucesso",
          bannerURL: result.secure_url,
          updated: true,
        });
      }
    );

    const readableBannerStream = new Readable();
    readableBannerStream.push(banner.buffer);
    readableBannerStream.push(null);
    readableBannerStream.pipe(uploadStream);
  } catch (error) {
    console.error("Erro ao atualizar banner", error);
    return res.status(500).json({ message: "Erro ao atualizar banner", error });
  }
});

router.post(
  "/changeNameCampusCurso/:token",
  multer().none(),
  async (req, res) => {
    try {
      const token = req.params.token;
      const { nickname, campus, curso, userName } = req.body;

      if (!token) {
        return res.status(400).json({
          message: "É preciso especificar um token",
          validToken: false,
        });
      }

      if (!nickname || !userName) {
        return res
          .status(404)
          .json({ message: "Campo faltando", updated: false });
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

      const userFound = await userSchema.findOneAndUpdate(
        { _id: decodedObj.user._id }, // Filtro de busca
        {
          $set: {
            nickname: nickname,
            campus: campus,
            curso: curso,
            userName: userName,
          },
        },
        { new: true } // Retorna o documento atualizado
      );

      if (!userFound) {
        return res
          .status(400)
          .json({ message: "Erro ao procurar usuário", updated: false });
      }

      return res
        .status(200)
        .json({ message: "Atualizado com sucesso", updated: true });
    } catch (error) {
      console.error("Erro ao mudar nome", error);
      return res
        .status(500)
        .json({ message: "Erro ao atualizar dados", error });
    }
  }
);

router.post("/changePassword/:token", multer().none(), async (req, res) => {
  try {
    const token = req.params.token;
    const { password, novasenha } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token", validToken: false });
    }

    if (!password || !novasenha) {
      return res.status(404).json({
        message: "Campos 'senha' ou 'novasenha' faltando",
        updated: false,
      });
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

    const foundUserToComparePassword = await userSchema.findOne({
      _id: decodedObj.user._id,
    });

    if (!foundUserToComparePassword) {
      return res
        .status(400)
        .json({ message: "Usuário não encontrado", updated: false });
    }

    const comparePassword = await bcrypt.compare(
      password,
      foundUserToComparePassword.password
    );

    if (!comparePassword) {
      return res.status(400).json({ message: "Senha incorreta" });
    }

    const encryptingNewPassword = await bcrypt.hash(novasenha, 10);

    const userFound = await userSchema.findOneAndUpdate(
      { _id: decodedObj.user._id }, // Filtro de busca
      {
        $set: {
          password: encryptingNewPassword,
        },
      },
      { new: true } // Retorna o documento atualizado
    );

    if (!userFound) {
      return res.status(400).json({
        message: "Erro ao procurar usuário",
        updated: false,
      });
    }

    return res
      .status(200)
      .json({ message: "Senha atualizada com sucesso", updated: true });
  } catch (error) {
    console.error("Erro ao mudar senha", error);
    return res.status(500).json({ message: "Erro ao atualizar dados", error });
  }
});

router.post("/changeEmail/:token", multer().none(), async (req, res) => {
  try {
    const token = req.params.token;
    const { email } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token", validToken: false });
    }

    if (!email) {
      return res
        .status(404)
        .json({ message: "Campo 'email' faltando", updated: false });
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

    const userFound = await userSchema.findOneAndUpdate(
      { _id: decodedObj.user._id }, // Filtro de busca
      {
        $set: {
          email: email,
        },
      },
      { new: true } // Retorna o documento atualizado
    );

    if (!userFound) {
      return res
        .status(400)
        .json({ message: "Erro ao procurar usuário", updated: false });
    }

    return res
      .status(200)
      .json({ message: "Atualizado com sucesso", updated: true });
  } catch (error) {
    console.error("Erro ao mudar email", error);
    return res.status(500).json({ message: "Erro ao atualizar dados", error });
  }
});

router.post("/changeBirthday/:token", multer().none(), async (req, res) => {
  try {
    const token = req.params.token;
    const { birthdaydata } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token", validToken: false });
    }

    if (!birthdaydata) {
      return res
        .status(404)
        .json({ message: "Campo 'birthdaydata' faltando", updated: false });
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

    const userFound = await userSchema.findOneAndUpdate(
      { _id: decodedObj.user._id }, // Filtro de busca
      {
        $set: {
          birthdaydata: birthdaydata,
        },
      },
      { new: true } // Retorna o documento atualizado
    );

    if (!userFound) {
      return res
        .status(400)
        .json({ message: "Erro ao procurar usuário", updated: false });
    }

    return res
      .status(200)
      .json({ message: "Atualizado com sucesso", updated: true });
  } catch (error) {
    console.error("Erro ao mudar gênero", error);
    return res.status(500).json({ message: "Erro ao atualizar dados", error });
  }
});

router.post("/changeGender/:token", multer().none(), async (req, res) => {
  try {
    const token = req.params.token;
    const { gender } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token", validToken: false });
    }

    if (!gender) {
      return res
        .status(404)
        .json({ message: "Campo 'gender' faltando", updated: false });
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

    const userFound = await userSchema.findOneAndUpdate(
      { _id: decodedObj.user._id }, // Filtro de busca
      {
        $set: {
          gender: gender,
        },
      },
      { new: true } // Retorna o documento atualizado
    );

    if (!userFound) {
      return res
        .status(400)
        .json({ message: "Erro ao procurar usuário", updated: false });
    }

    return res
      .status(200)
      .json({ message: "Atualizado com sucesso", updated: true });
  } catch (error) {
    console.error("Erro ao mudar gênero", error);
    return res.status(500).json({ message: "Erro ao atualizar dados", error });
  }
});

router.post("/changeBio/:token", multer().none(), async (req, res) => {
  try {
    const token = req.params.token;
    const { bio } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "É preciso especificar um token", validToken: false });
    }

    if (!bio) {
      return res
        .status(404)
        .json({ message: "Campo 'bio' faltando", updated: false });
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

    const userFound = await userSchema.findOneAndUpdate(
      { _id: decodedObj.user._id }, // Filtro de busca
      {
        $set: {
          bio: bio,
        },
      },
      { new: true } // Retorna o documento atualizado
    );

    if (!userFound) {
      return res
        .status(400)
        .json({ message: "Erro ao procurar usuário", updated: false });
    }

    return res
      .status(200)
      .json({ message: "Atualizado com sucesso", updated: true });
  } catch (error) {
    console.error("Erro ao mudar bio", error);
    return res.status(500).json({ message: "Erro ao atualizar dados", error });
  }
});

export default router;
