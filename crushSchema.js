import mongoose from "mongoose";

const crushSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  liked: {
    type: [mongoose.Schema.Types.ObjectId],
    required: false,
  },
  likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Crush = mongoose.model("Crush", crushSchema);

export default Crush;
