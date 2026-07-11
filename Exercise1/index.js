import OpenAI from "openai";
import dotenv from "dotenv";
import readlineSync from "readline-sync";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateOutline(topic) {
  console.log("\nGenerating blog outline...\n");

  const stream = await client.responses.stream({
    model: "gpt-5",
    input: `You are an expert content writer.

Create a detailed blog post outline about:

"${topic}"

Requirements:
- Catchy title
- Introduction
- 6 main headings
- 3 bullet points under each heading
- Conclusion

Format everything in Markdown.`,
  });

  let outline = "";

  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      process.stdout.write(event.delta);
      outline += event.delta;
    }
  }

  console.log("\n");
  return outline;
}

async function summarizeOutline(outline) {
  const response = await client.responses.create({
    model: "gpt-5",
    input: `Summarize the following blog outline in exactly two sentences.

${outline}`,
  });

  return response.output_text;
}

async function answerQuestion(topic, outline, question) {
  const response = await client.responses.create({
    model: "gpt-5",
    input: `You are helping a user write a blog.

Topic:
${topic}

Outline:
${outline}

User Question:
${question}

Answer clearly and concisely.`,
  });

  return response.output_text;
}

async function main() {
  console.clear();
  console.log("======================================");
  console.log("      Smart Content Assistant");
  console.log("======================================\n");

  const topic = readlineSync.question("Enter a blog topic: ");

  const outline = await generateOutline(topic);

  console.log("========== SUMMARY ==========\n");

  const summary = await summarizeOutline(outline);

  console.log(summary);

  console.log("\n=============================");
  console.log("Ask follow-up questions");
  console.log("Type 'exit' to quit.");
  console.log("=============================\n");

  while (true) {
    const question = readlineSync.question("> ");

    if (question.trim().toLowerCase() === "exit") {
      console.log("\nGoodbye!\n");
      process.exit(0);
    }

    const answer = await answerQuestion(topic, outline, question);

    console.log("\nAnswer:\n");
    console.log(answer);
    console.log();
  }
}

main().catch((err) => {
  console.error("\nError:", err.message);
});