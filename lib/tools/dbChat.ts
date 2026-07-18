import { tool } from "ai";
import { z } from "zod";
import { connectDB } from "../db";
import Movie from "../models/Movie";
import User from "../models/User";
import Review from "../models/Review";

/**
 * This tool doesn't do free-text-to-SQL translation with a second model call.
 * Instead, the *outer* chat model (which already understands natural language)
 * is prompted to fill in these structured, validated parameters itself.
 * This is safer than generating raw queries: no injection risk, and Zod
 * rejects anything malformed before it touches the database.
 */
export const dbChatTool = tool({
  description:
    "Query the movies, users, or reviews collections. Convert the user's natural-language " +
    "request (e.g. 'sci-fi movies', 'users over 25', 'movies rated above 8.5', 'count movies by genre') " +
    "into these structured filter parameters.",
  parameters: z.object({
    collection: z.enum(["movies", "users", "reviews"]),
    operation: z.enum(["find", "count", "groupByGenre"]).describe(
      "'find' returns matching documents, 'count' returns a total, 'groupByGenre' only applies to movies"
    ),
    filters: z
      .object({
        genre: z.string().optional().describe("Genre to filter movies by, e.g. 'sci-fi'"),
        minRating: z.number().optional().describe("Minimum movie rating"),
        maxRating: z.number().optional(),
        minAge: z.number().optional().describe("Minimum user age"),
        maxAge: z.number().optional(),
        titleContains: z.string().optional().describe("Partial movie title match"),
      })
      .optional(),
    limit: z.number().min(1).max(50).default(10),
  }),
  execute: async ({ collection, operation, filters = {}, limit }) => {
    try {
      await connectDB();

      if (collection === "movies") {
        const query: Record<string, any> = {};
        if (filters.genre) query.genre = { $regex: filters.genre, $options: "i" };
        if (filters.titleContains) query.title = { $regex: filters.titleContains, $options: "i" };
        if (filters.minRating !== undefined || filters.maxRating !== undefined) {
          query.rating = {};
          if (filters.minRating !== undefined) query.rating.$gte = filters.minRating;
          if (filters.maxRating !== undefined) query.rating.$lte = filters.maxRating;
        }

        if (operation === "count") {
          const count = await Movie.countDocuments(query);
          return { success: true, operation, collection, count };
        }

        if (operation === "groupByGenre") {
          const groups = await Movie.aggregate([
            { $unwind: "$genre" },
            { $group: { _id: "$genre", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
            { $sort: { count: -1 } },
          ]);
          return { success: true, operation, collection, groups };
        }

        const results = await Movie.find(query).limit(limit).lean();
        return { success: true, operation, collection, count: results.length, results };
      }

      if (collection === "users") {
        const query: Record<string, any> = {};
        if (filters.minAge !== undefined || filters.maxAge !== undefined) {
          query.age = {};
          if (filters.minAge !== undefined) query.age.$gte = filters.minAge;
          if (filters.maxAge !== undefined) query.age.$lte = filters.maxAge;
        }
        if (filters.genre) query.favoriteGenre = { $regex: filters.genre, $options: "i" };

        if (operation === "count") {
          const count = await User.countDocuments(query);
          return { success: true, operation, collection, count };
        }

        const results = await User.find(query).limit(limit).lean();
        return { success: true, operation, collection, count: results.length, results };
      }

      // reviews
      if (operation === "count") {
        const count = await Review.countDocuments({});
        return { success: true, operation, collection, count };
      }
      const results = await Review.find({})
        .populate("movieId", "title")
        .populate("userId", "name")
        .limit(limit)
        .lean();
      return { success: true, operation, collection, count: results.length, results };
    } catch (error: any) {
      return {
        success: false,
        error: "Database query failed",
        details: error?.message ?? String(error),
      };
    }
  },
});
