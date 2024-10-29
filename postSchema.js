import { ObjectId } from "mongodb";
import mongoose from "mongoose";

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
  userAvatar: {
    type: String,
    required: false,
  },
  userId: {
    type: ObjectId,
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
  comments: [
    {
      type: ObjectId,
      ref: "Comment",
    },
  ],
  commentCount: {
    type: Number,
    default: 0,
    required: true,
  },
});

const Post = mongoose.model("Post", postSchema);

export default Post;
