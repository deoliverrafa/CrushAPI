import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  insertAt: {
    type: Date,
    default: () => new Date(),
  },
  likeCount: {
    type: Number,
    default: 0,
    required: true,
  },
  likedBy: {
    type: [ObjectId],
    required: false,
  },
  mentionedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  hashtags: [String],
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
