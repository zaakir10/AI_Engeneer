# AI SDK Exercise — Database Chat, Movie Database & Dad Jokes

Working scaffold for the three tools described in the exercise, built with
**Next.js 14 (App Router)**, the **Vercel AI SDK**, and **MongoDB/Mongoose** —
matching the stack you're already using on your blog project.

## What's implemented

| Part | Status | Notes |
|---|---|---|
| 1. Database Chat Tool | ✅ Core done | Structured filters (not raw NL→SQL translation — the outer model fills in validated params, which avoids injection risk entirely). Supports find / count / groupByGenre across movies, users, reviews. |
| 2. Movie Database Tool | ✅ Core done | OMDb search with Mongo caching (7-day TTL), stale-cache fallback on API failure, genre/year recommendations. |
| 3. Dad Jokes Tool | ✅ Core done | Live API with 5s timeout, local DB fallback, hardcoded last-resort fallback, keyword search, upvote/downvote. |
| Frontend | ✅ Basic | Chat UI via `useChat`, shows tool-call indicators, suggestion chips. |
| Error handling | ✅ Basic | Every tool returns `{ success, error, details }` instead of throwing; route-level try/catch too. |
| Pagination / indexing / batch API calls / circuit breaker / tests | ⬜ Not yet | See "Next steps" below — these are the parts worth doing once the core flow is confirmed working. |

## Setup

```bash
cd ai-sdk-exercise
npm install
cp .env.example .env
# fill in MONGODB_URI, OPENAI_API_KEY, OMDB_API_KEY in .env

npm run seed   # populates sample movies/users/reviews/jokes
npm run dev    # http://localhost:3000
```

Get a free OMDb key at https://www.omdbapi.com/apikey.aspx (1000 req/day).
icanhazdadjoke.com needs no key.

## How the tools are wired

All three tools are registered in `app/api/chat/route.ts` via the AI SDK's
`streamText({ tools: {...} })`. The model decides which tool(s) to call based
on the user's message — e.g. "sci-fi movies over 8 rating" triggers
`queryDatabase`, "tell me about Interstellar" triggers `searchMovie`.

- `lib/tools/dbChat.ts` — Part 1
- `lib/tools/movieSearch.ts` — Part 2 (search + recommend)
- `lib/tools/dadJoke.ts` — Part 3 (fetch + rate)

## Design decision worth flagging

The spec asks for "natural language to SQL/NoSQL query conversion." Rather
than having the model generate raw Mongo queries as a string (which is an
injection risk and hard to validate), I had the tool schema itself express
the query in structured, Zod-validated fields (`genre`, `minRating`, etc.),
and let the *chat model* — which already does NL understanding — populate
those fields as its tool call. Same natural-language capability, no
injection surface. Worth confirming this matches what you want before
building out Part 6 (validation) further.

## Next steps (not yet built)

- Pagination for large result sets (Part 7)
- Explicit rate limiting / circuit breaker wrapper around OMDb + dad-joke calls (Part 6/7)
- Unit + integration tests (Part 8)
- Movie posters/tables rendering in the UI beyond plain text (Part 5)
- Conversation history persistence to Mongo (currently in-memory per session only)

Let me know which of these to tackle next.
