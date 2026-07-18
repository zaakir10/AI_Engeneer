import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { dbChatTool } from "@/lib/tools/dbChat";
import { movieSearchTool, movieRecommendTool } from "@/lib/tools/movieSearch";
import { dadJokeTool, rateJokeTool } from "@/lib/tools/dadJoke";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const result = streamText({
      model: openai("gpt-4o"),
      system:
        "You are a helpful assistant with three capabilities: " +
        "(1) querying a movies/users/reviews database, " +
        "(2) looking up detailed movie info via OMDb, " +
        "(3) telling jokes. " +
        "Always use the appropriate tool rather than guessing at data. " +
        "When a tool returns success: false, explain the error to the user plainly and suggest a next step " +
        "instead of making up an answer.",
      messages,
      tools: {
        queryDatabase: dbChatTool,
        searchMovie: movieSearchTool,
        recommendMovies: movieRecommendTool,
        getJoke: dadJokeTool,
        rateJoke: rateJokeTool,
      },
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: "Chat request failed", details: error?.message ?? String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
