import mongoose from "mongoose";

const aiRobotVoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    voiceName: {
      type: String,
      required: true,
      trim: true,
    },
    voiceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const AiRobotVoice = mongoose.model("AiRobotVoice", aiRobotVoiceSchema);

export default AiRobotVoice;
