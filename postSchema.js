import mongoose from "mongoose"

const postSchema = new mongoose.Schema({
    nickname: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    campus: {
        type: String,
        required: false,
    },
    references: {
        type: String,
        required: false,
    },
    content: {
        type: String,
        required: true,
    },
    isAnonymous: {
        type: Boolean,
        required: true,
    },
    photoURL: {
        type: String,
        required: false,
    },
    insertAt: {
        type: Date,
        default: () => new Date(),
    },
});

const Post = mongoose.model('Post', postSchema);

export default Post;