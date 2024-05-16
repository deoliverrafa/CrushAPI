const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

    nickname: {
        type: String,
        required: true,
        index: true,
    },

    email: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    birthdaydata: {
        type: String,
        required: true,
    },

    campus: {
        type: String,
        required: true,
    },

    insertAt: {
        type: Date,
        default: () => new Date(),
        required: false,
    },

    type: {
        type: String,
        required: false,
    },

    avatar: {
        type: String,
        required: false
    },

    bio: {
        type: String,
        required: false,
        default: '',
    },

    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    }],

    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    Nfollowing: {
        type: Number,
        default: 0,
    },

    Nfollowers: {
        type: Number,
        default: 0,
    },

});

const Usuario = mongoose.model('User', userSchema);

module.exports = Usuario;