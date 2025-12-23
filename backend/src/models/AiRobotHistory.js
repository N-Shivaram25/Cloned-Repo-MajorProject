import mongoose from "mongoose";

const aiRobotMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["system", "user", "assistant"],
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const aiRobotHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      default: "general",
      index: true,
    },
    messages: {
      type: [aiRobotMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

aiRobotHistorySchema.index({ userId: 1, module: 1 }, { unique: true });

const AiRobotHistory = mongoose.model("AiRobotHistory", aiRobotHistorySchema);

export default AiRobotHistory;
