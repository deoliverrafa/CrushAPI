import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
        ref: 'User',
    },
    content: {
        type: String,
        required: true,
    },
    insertAt: {
        type: Date,
        default: () => new Date(),
    },
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
