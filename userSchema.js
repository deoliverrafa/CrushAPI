import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
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
    },
    type: {
        type: String,
    },
    avatar: {
        type: String,
    },
    bio: {
        type: String,
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

const User = mongoose.model('User', userSchema);

export default User;