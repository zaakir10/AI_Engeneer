import mongoose, { Schema } from "mongoose";

export interface IJoke {
  text: string;
  category: "dad" | "programming" | "general";
  source: "icanhazdadjoke" | "local";
  upvotes: number;
  downvotes: number;
}

const JokeSchema = new Schema<IJoke>(
  {
    text: { type: String, required: true },
    category: {
      type: String,
      enum: ["dad", "programming", "general"],
      default: "dad",
      index: true,
    },
    source: { type: String, enum: ["icanhazdadjoke", "local"], default: "local" },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

JokeSchema.index({ text: "text" });

export default mongoose.models.Joke ||
  mongoose.model<IJoke>("Joke", JokeSchema);
