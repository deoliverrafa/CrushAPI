
// Dependêncies imports
const express = require('express')

// Route Imports
const userRoutes = require('./userRoutes')
const authRoutes = require('./authRoutes')
const profileRoutes = require('./profileRoutes')

// Ambient var
const app = express();
const cors = require('cors');

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



const PORT = process.env.PORT || 4040;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta", + PORT);
})