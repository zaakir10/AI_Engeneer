import { tool } from "ai";
import { z } from "zod";
import { connectDB } from "../db";
import Movie from "../models/Movie";

const OMDB_BASE = "http://www.omdbapi.com/";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

async function fetchFromOMDb(title: string, year?: number) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) throw new Error("OMDB_API_KEY is not set");

  const params = new URLSearchParams({ t: title, apikey: apiKey });
  if (year) params.set("y", String(year));

  const res = await fetch(`${OMDB_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`OMDb request failed with status ${res.status}`);

  const data = await res.json();
  if (data.Response === "False") {
    throw new Error(data.Error || "Movie not found");
  }
  return data;
}

export const movieSearchTool = tool({
  description:
    "Look up detailed movie information (plot, cast, ratings, poster, runtime) by title, " +
    "optionally narrowed by year. Checks the local cache first, falls back to the OMDb API, " +
    "and caches fresh results for next time.",
  parameters: z.object({
    title: z.string().describe("Movie title to search for (partial matches OK)"),
    year: z.number().optional().describe("Release year, to disambiguate remakes etc."),
  }),
  execute: async ({ title, year }) => {
    try {
      await connectDB();

      // 1. Check cache
      const cached = await Movie.findOne({
        title: { $regex: `^${title}$`, $options: "i" },
        ...(year ? { year } : {}),
      }).lean<import("../models/Movie").IMovie & { _id: unknown }>();

      const isFresh =
        cached?.cachedAt && Date.now() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS;

      if (cached && isFresh && cached.plot) {
        return { success: true, source: "cache", movie: cached };
      }

      // 2. Fall back to OMDb API
      try {
        const omdbData = await fetchFromOMDb(title, year);

        const update = {
          title: omdbData.Title,
          year: parseInt(omdbData.Year, 10) || year || 0,
          genre: (omdbData.Genre || "").split(",").map((g: string) => g.trim().toLowerCase()),
          rating: parseFloat(omdbData.imdbRating) || 0,
          director: omdbData.Director,
          description: omdbData.Plot,
          plot: omdbData.Plot,
          cast: omdbData.Actors,
          poster: omdbData.Poster !== "N/A" ? omdbData.Poster : undefined,
          runtime: omdbData.Runtime,
          imdbId: omdbData.imdbID,
          cachedAt: new Date(),
        };

        const saved = await Movie.findOneAndUpdate(
          { title: { $regex: `^${update.title}$`, $options: "i" } },
          update,
          { upsert: true, new: true }
        ).lean();

        return { success: true, source: "omdb", movie: saved };
      } catch (apiError: any) {
        // 3. API failed - serve stale cache if we have any, otherwise surface the error
        if (cached) {
          return {
            success: true,
            source: "stale_cache",
            note: "OMDb API unavailable, returning last cached data",
            movie: cached,
          };
        }
        return {
          success: false,
          error: "Movie not found",
          details: apiError?.message ?? String(apiError),
        };
      }
    } catch (error: any) {
      return { success: false, error: "Lookup failed", details: error?.message ?? String(error) };
    }
  },
});

export const movieRecommendTool = tool({
  description: "Recommend movies from the local cached database by genre and/or year range.",
  parameters: z.object({
    genre: z.string().optional(),
    minYear: z.number().optional(),
    maxYear: z.number().optional(),
    limit: z.number().min(1).max(20).default(5),
  }),
  execute: async ({ genre, minYear, maxYear, limit }) => {
    await connectDB();
    const query: Record<string, any> = {};
    if (genre) query.genre = { $regex: genre, $options: "i" };
    if (minYear !== undefined || maxYear !== undefined) {
      query.year = {};
      if (minYear !== undefined) query.year.$gte = minYear;
      if (maxYear !== undefined) query.year.$lte = maxYear;
    }
    const results = await Movie.find(query).sort({ rating: -1 }).limit(limit).lean();
    return { success: true, count: results.length, results };
  },
});
