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
});

const Crush = mongoose.model("Crush", crushSchema);

export default Crush;
