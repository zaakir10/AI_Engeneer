import mongoose, { Schema } from "mongoose";

export interface IMovie {
  title: string;
  year: number;
  genre: string[];
  rating: number;
  director: string;
  description: string;
  // OMDb cache fields (populated lazily when fetched via the movie tool)
  plot?: string;
  cast?: string;
  poster?: string;
  runtime?: string;
  imdbId?: string;
  cachedAt?: Date;
}

const MovieSchema = new Schema<IMovie>(
  {
    title: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },
    genre: { type: [String], required: true, index: true },
    rating: { type: Number, required: true, index: true },
    director: { type: String, required: true },
    description: { type: String, default: "" },
    plot: String,
    cast: String,
    poster: String,
    runtime: String,
    imdbId: String,
    cachedAt: Date,
  },
  { timestamps: true }
);

MovieSchema.index({ title: "text", description: "text" });

export default mongoose.models.Movie ||
  mongoose.model<IMovie>("Movie", MovieSchema);
