import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create output folder
const outputDir = "./audio";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Conversation
const conversation = [
  {
    speaker: "Alice",
    voice: "alloy",
    emotion: "Friendly and excited",
    text: "Hi Bob! Have you heard about the latest AI models? They're becoming incredibly capable.",
  },
  {
    speaker: "Bob",
    voice: "echo",
    emotion: "Calm and curious",
    text: "Yes, I have. I'm especially interested in how they help developers become more productive.",
  },
  {
    speaker: "Alice",
    voice: "nova",
    emotion: "Enthusiastic",
    text: "Exactly! They can generate code, explain concepts, and even help design entire applications.",
  },
  {
    speaker: "Bob",
    voice: "onyx",
    emotion: "Thoughtful",
    text: "The future looks exciting. I think AI will become an essential tool for almost every profession.",
  },
];

async function generateSpeech(line, index) {
  console.log(`Generating ${line.speaker}...`);

  const response = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: line.voice,
    input: line.text,
    instructions: `Speak in a ${line.emotion} tone.`,
  });

  const buffer = Buffer.from(await response.arrayBuffer());

  const fileName = `${index + 1}-${line.speaker}.mp3`;

  fs.writeFileSync(path.join(outputDir, fileName), buffer);

  console.log(`Saved: ${fileName}`);
}

async function main() {
  console.log("Generating conversation...\n");

  for (let i = 0; i < conversation.length; i++) {
    await generateSpeech(conversation[i], i);
  }

  console.log("\nDone!");
  console.log("Audio files saved in the ./audio folder.");
}

main().catch(console.error);