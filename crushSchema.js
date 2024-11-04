import { ObjectId } from "mongodb";
import mongoose from "mongoose";

const crushSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
      },
    liked: {
      type: [ObjectId],
      required: false,
    },
  });
  
  const Crush = mongoose.model("Crush", crushSchema);
  
  export default Crush;
  