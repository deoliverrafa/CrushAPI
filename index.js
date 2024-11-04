// Dependêncies imports
import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

// Route Imports
import userRoutes from "./userRoutes.js"
import authRoutes from "./authRoutes.js"
import profileRoutes from "./profileRoutes.js"
import postRoutes from "./postRoutes.js"
import commentRoutes from './commentRoutes.js'
import crushRoutes from './crushRoutes.js'

// Ambient var
const app = express();
import cors from "cors"

// app.use(cors({
//     origin: [''],
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
// }))

app.use(express.json());

app.use(cors())

// Setando as rotas
app.use('/user', userRoutes)
app.use('/auth', authRoutes)
app.use('/profile', profileRoutes)
app.use('/post', postRoutes)
app.use('/comment', commentRoutes)
app.use('/crush', crushRoutes)

const PORT = process.env.PORT || 4040;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta", + PORT);
})