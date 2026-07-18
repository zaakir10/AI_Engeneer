import mongoose, { Schema, Types } from "mongoose";

export interface IReview {
  movieId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  date: Date;
}

const ReviewSchema = new Schema<IReview>({
  movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  rating: { type: Number, required: true, min: 0, max: 10 },
  comment: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
