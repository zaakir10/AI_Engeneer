import { tool } from "ai";
import { z } from "zod";
import { connectDB } from "../db";
import Joke from "../models/Joke";
import { localJokes } from "../../data/localJokes";

async function fetchRandomFromApi(): Promise<{ text: string } | null> {
  try {
    const res = await fetch("https://icanhazdadjoke.com/", {
      headers: { Accept: "application/json" },
      // avoid hanging forever if the API is down
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { text: data.joke };
  } catch {
    return null; // circuit breaks silently, caller falls back
  }
}

export const dadJokeTool = tool({
  description:
    "Fetch a random joke. Supports categories (dad, programming, general) and keyword search. " +
    "Tries the live icanhazdadjoke.com API first, falls back to a local stored joke if the API is unreachable.",
  parameters: z.object({
    category: z.enum(["dad", "programming", "general"]).optional(),
    keyword: z.string().optional().describe("Search stored jokes for a keyword instead of fetching random"),
  }),
  execute: async ({ category, keyword }) => {
    await connectDB();

    if (keyword) {
      const matches = await Joke.find({ $text: { $search: keyword } }).limit(5).lean();
      return { success: true, mode: "search", count: matches.length, jokes: matches };
    }

    // Only the general/dad category maps to the live API; programming jokes
    // always come from the local set since icanhazdadjoke doesn't categorize.
    if (!category || category === "dad" || category === "general") {
      const apiResult = await fetchRandomFromApi();
      if (apiResult) {
        const saved = await Joke.create({
          text: apiResult.text,
          category: "dad",
          source: "icanhazdadjoke",
        });
        return { success: true, source: "api", joke: saved };
      }
    }

    // Fallback: local database, filtered by category if given
    const query = category ? { category } : {};
    const count = await Joke.countDocuments(query);
    if (count === 0) {
      const fallback = localJokes[Math.floor(Math.random() * localJokes.length)];
      return { success: true, source: "hardcoded_fallback", joke: fallback };
    }
    const random = await Joke.findOne(query).skip(Math.floor(Math.random() * count)).lean();
    return { success: true, source: "local_db_fallback", joke: random };
  },
});

export const rateJokeTool = tool({
  description: "Record a thumbs up or thumbs down rating for a joke by its ID.",
  parameters: z.object({
    jokeId: z.string(),
    vote: z.enum(["up", "down"]),
  }),
  execute: async ({ jokeId, vote }) => {
    try {
      await connectDB();
      const field = vote === "up" ? "upvotes" : "downvotes";
      const updated = await Joke.findByIdAndUpdate(jokeId, { $inc: { [field]: 1 } }, { new: true }).lean();
      if (!updated) return { success: false, error: "Joke not found" };
      return { success: true, joke: updated };
    } catch (error: any) {
      return { success: false, error: "Rating failed", details: error?.message ?? String(error) };
    }
  },
});
