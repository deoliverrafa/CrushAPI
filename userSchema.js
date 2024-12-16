import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    index: true,
  },
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  emailVerified: {
    type: Boolean,
    default: false
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    password: {
      type: String,
      required: true,
    },
    birthdaydata: {
      type: String,
    },
    gender: {
      type: String,
    },
    campus: {
      type: String,
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
    banner: {
      type: String,
    },
    curso: {
      type: String,
    },
    bio: {
      type: String,
    default: "",
    },
    messages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    ],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ],
    Nfollowing: {
      type: Number,
    default: 0,
    },
    Nfollowers: {
      type: Number,
    default: 0,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
    default: "offline",
    },
    private: {
      type: Boolean,
    default: false,
    },
    link: {
      type: String,
    },
    instagram: {
      type: String,
    },
    facebook: {
      type: String,
    },
    twitter: {
      type: String,
    },
    likeCount: {
      type: Number,
      default: 0,
      required: true,
    },
    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
    },
    likedUsers: [{
      type: mongoose.Schema.Types.ObjectId, ref: "User"
    }],
  });

  const User = mongoose.model("User", userSchema);

  export default User;