import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
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
  mentionedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  hashtags: [String],
});

const Post = mongoose.model("Post", postSchema);

export default Post;
