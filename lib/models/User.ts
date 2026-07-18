import mongoose, { Schema } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  age: number;
  favoriteGenre: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true, index: true },
    favoriteGenre: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
